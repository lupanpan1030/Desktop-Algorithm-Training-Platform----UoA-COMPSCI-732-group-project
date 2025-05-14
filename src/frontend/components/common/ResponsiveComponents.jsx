import React from "react";
import {
  useTheme,
  useMediaQuery,
  Button,
  Chip,
  ToggleButtonGroup,
} from "@mui/material";

function useSmUp() {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.up("sm"));
}

export function ResponsiveButton(props) {
  const smUp = useSmUp();
  const { children, ...other } = props;
  return (
    <Button size={smUp ? "large" : "medium"} {...other}>
      {children}
    </Button>
  );
}

export function ResponsiveChip(props) {
  const smUp = useSmUp();
  return <Chip size={smUp ? "medium" : "small"} {...props} />;
}

export function ResponsiveToggleGroup(props) {
  const smUp = useSmUp();
  return <ToggleButtonGroup size={smUp ? "medium" : "small"} {...props} />;
}
