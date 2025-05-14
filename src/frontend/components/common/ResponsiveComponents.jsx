import React from "react";
import {
  useTheme,
  useMediaQuery,
  Button,
  Chip,
  ToggleButtonGroup,
} from "@mui/material";

function useMdUp() {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.up("md"));
}

export function ResponsiveButton(props) {
  const { baseSize = "medium", children, ...other } = props;
  const mdUp = useMdUp();
  let size;
  if (baseSize === "large") {
    size = mdUp ? "large" : "medium";
  } else if (baseSize === "medium") {
    size = mdUp ? "medium" : "small";
  } else {
    size = baseSize;
  }
  return (
    <Button size={size} {...other}>
      {children}
    </Button>
  );
}

export function ResponsiveChip(props) {
  const mdUp = useMdUp();
  return <Chip size={mdUp ? "medium" : "small"} {...props} />;
}

export function ResponsiveToggleGroup(props) {
  const mdUp = useMdUp();
  return <ToggleButtonGroup size={mdUp ? "medium" : "small"} {...props} />;
}
