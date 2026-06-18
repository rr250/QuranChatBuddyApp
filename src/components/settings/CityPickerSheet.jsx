import React, { useEffect, useMemo, useState } from "react";
import { FlatList, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
    PickerSheetShell,
    PickerOptionRow,
    pickerSheetStyles,
} from "./PickerSheetShell";
import { searchCities } from "../../utils/citySearch";

export const CityPickerSheet = ({
    visible,
    selectedCity,
    usingCurrentLocation = false,
    onSelect,
    onUseCurrentLocation,
    onClose,
}) => {
    const [query, setQuery] = useState("");

    useEffect(() => {
        if (visible) {
            setQuery("");
        }
    }, [visible]);

    const cities = useMemo(() => searchCities(query), [query]);

    return (
        <PickerSheetShell
            visible={visible}
            title="Select Your City"
            onClose={onClose}
            maxHeight="85%"
        >
            {onUseCurrentLocation ? (
                <View style={pickerSheetStyles.listHeader}>
                    <PickerOptionRow
                        label="Use current location"
                        subtitle="Prayer times based on your device GPS"
                        selected={usingCurrentLocation}
                        showDivider
                        leadingIcon={
                            <MaterialCommunityIcons
                                name="crosshairs-gps"
                                size={20}
                                color="rgba(255,255,255,0.85)"
                            />
                        }
                        onPress={async () => {
                            await onUseCurrentLocation();
                            onClose();
                        }}
                    />
                </View>
            ) : null}
            <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search city or country"
                placeholderTextColor="rgba(255,255,255,0.45)"
                style={pickerSheetStyles.search}
                autoCorrect={false}
            />
            <FlatList
                data={cities}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 420 }}
                renderItem={({ item, index }) => {
                    const selected =
                        !usingCurrentLocation &&
                        selectedCity?.name === item.name &&
                        selectedCity?.country === item.country;

                    return (
                        <PickerOptionRow
                            label={item.name}
                            subtitle={item.country}
                            selected={selected}
                            showDivider={index < cities.length - 1}
                            onPress={() => {
                                onSelect(item);
                                onClose();
                            }}
                        />
                    );
                }}
            />
        </PickerSheetShell>
    );
};
