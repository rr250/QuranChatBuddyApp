#!/bin/bash

# generate-firebase-configs.sh
# Script to generate Firebase config files from environment variables during CI/CD

set -e

echo "🔧 Generating Firebase configuration files..."

# Generate google-services.json
cat > google-services.json << EOF
{
  "project_info": {
    "project_number": "${FIREBASE_PROJECT_NUMBER}",
    "firebase_url": "${FIREBASE_DATABASE_URL}",
    "project_id": "${FIREBASE_PROJECT_ID}",
    "storage_bucket": "${FIREBASE_STORAGE_BUCKET}"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "${FIREBASE_ANDROID_APP_ID}",
        "android_client_info": {
          "package_name": "${ANDROID_PACKAGE_NAME}"
        }
      },
      "oauth_client": [
        {
          "client_id": "${FIREBASE_ANDROID_CLIENT_ID}",
          "client_type": 3
        }
      ],
      "api_key": [
        {
          "current_key": "${FIREBASE_ANDROID_API_KEY}"
        }
      ],
      "services": {
        "appinvite_service": {
          "other_platform_oauth_client": [
            {
              "client_id": "${FIREBASE_ANDROID_CLIENT_ID}",
              "client_type": 3
            },
            {
              "client_id": "${FIREBASE_IOS_CLIENT_ID}",
              "client_type": 2,
              "ios_info": {
                "bundle_id": "${IOS_BUNDLE_ID}"
              }
            }
          ]
        }
      }
    }
  ],
  "configuration_version": "1"
}
EOF

# Generate GoogleService-Info.plist
cat > GoogleService-Info.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CLIENT_ID</key>
	<string>${FIREBASE_IOS_CLIENT_ID}</string>
	<key>REVERSED_CLIENT_ID</key>
	<string>${FIREBASE_IOS_REVERSED_CLIENT_ID}</string>
	<key>API_KEY</key>
	<string>${FIREBASE_IOS_API_KEY}</string>
	<key>GCM_SENDER_ID</key>
	<string>${FIREBASE_PROJECT_NUMBER}</string>
	<key>PLIST_VERSION</key>
	<string>1</string>
	<key>BUNDLE_ID</key>
	<string>${IOS_BUNDLE_ID}</string>
	<key>PROJECT_ID</key>
	<string>${FIREBASE_PROJECT_ID}</string>
	<key>STORAGE_BUCKET</key>
	<string>${FIREBASE_STORAGE_BUCKET}</string>
	<key>IS_ADS_ENABLED</key>
	<false></false>
	<key>IS_ANALYTICS_ENABLED</key>
	<false></false>
	<key>IS_APPINVITE_ENABLED</key>
	<true></true>
	<key>IS_GCM_ENABLED</key>
	<true></true>
	<key>IS_SIGNIN_ENABLED</key>
	<true></true>
	<key>GOOGLE_APP_ID</key>
	<string>${FIREBASE_IOS_APP_ID}</string>
	<key>DATABASE_URL</key>
	<string>${FIREBASE_DATABASE_URL}</string>
</dict>
</plist>
EOF

echo "✅ Firebase configuration files generated successfully!"
echo "📁 Files created:"
echo "   - google-services.json"
echo "   - GoogleService-Info.plist"