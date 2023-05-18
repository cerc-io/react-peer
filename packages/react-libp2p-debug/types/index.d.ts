import React from "react";

import { ThemeProviderProps } from "@mui/material/styles/ThemeProvider";
import { DefaultComponentProps } from "@mui/material/OverridableComponent";
import { BoxTypeMap } from '@mui/system';
import { ScopedCssBaselineTypeMap, Theme } from "@mui/material";

// TODO: Setup typescript for react library packages
declare function DebugPanel(_ref: any): React.FunctionComponentElement<ThemeProviderProps<unknown>>;
declare function SelfInfo(_ref: any): React.FunctionComponentElement<DefaultComponentProps<BoxTypeMap<{}, "div", Theme>>>
declare function Connections(_ref: any): React.FunctionComponentElement<DefaultComponentProps<BoxTypeMap<{}, "div", Theme>>>
declare function PeersGraph(_ref: any): React.FunctionComponentElement<DefaultComponentProps<ScopedCssBaselineTypeMap<{}, "div">>>
