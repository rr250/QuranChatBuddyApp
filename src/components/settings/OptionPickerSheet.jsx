import React from "react";
import { View } from "react-native";
import {
    PickerSheetShell,
    PickerOptionRow,
} from "./PickerSheetShell";

export const OptionPickerSheet = ({
    visible,
    title,
    options,
    selectedId,
    onSelect,
    onClose,
}) => (
    <PickerSheetShell
        visible={visible}
        title={title}
        onClose={onClose}
        scrollable={options.length > 6}
        maxHeight={options.length > 6 ? "80%" : "60%"}
    >
        <View>
            {options.map((option, index) => {
                const selected = option.id === selectedId;
                return (
                    <PickerOptionRow
                        key={option.id}
                        label={option.label}
                        selected={selected}
                        showDivider={index < options.length - 1}
                        onPress={() => {
                            onSelect(option);
                            onClose();
                        }}
                    />
                );
            })}
        </View>
    </PickerSheetShell>
);
