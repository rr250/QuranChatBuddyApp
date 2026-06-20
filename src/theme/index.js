/**
 * Central theme barrel — import everything from here.
 *
 * Usage:
 *   import { theme, colors, spacing, glass, gradients } from "../../theme";
 *
 * This file re-exports all design tokens from their source files so that
 * components never need to reach into theme.js or glass.js directly.
 * Add new tokens to the source files; they automatically appear here.
 */

export {
    theme,
    darkTheme,
    colors,
    spacing,
    typography,
    borderRadius,
    elevation,
} from "../constants/theme";

export { glass, gradients } from "../constants/glass";
