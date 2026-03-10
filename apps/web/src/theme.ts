import { createTheme, MantineColorsTuple } from '@mantine/core';

const pastelBlue: MantineColorsTuple = [
  '#f6fbff',
  '#eaf7ff',
  '#d6f0ff',
  '#c0e9ff',
  '#aee2ff',
  '#8fd8ff',
  '#6ccfff',
  '#4bbfff',
  '#2aa6ff',
  '#1687e6',
];

const warmCoral: MantineColorsTuple = [
  '#fff0f0',
  '#ffe0e0',
  '#ffc2c2',
  '#ffa0a0',
  '#ff8080',
  '#ff6b6b',
  '#fa5252',
  '#f03e3e',
  '#e03131',
  '#c92a2a',
];

const warmGreen: MantineColorsTuple = [
  '#f0faf0',
  '#d8f5d8',
  '#b2e2b2',
  '#8fce8f',
  '#6abf6a',
  '#51b351',
  '#40a040',
  '#2f8a2f',
  '#237523',
  '#1a601a',
];

export const theme = createTheme({
  primaryColor: 'pastelBlue',
  colors: {
    pastelBlue,
    warmCoral,
    warmGreen,
  },
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headings: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: '700',
  },
  radius: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },
  defaultRadius: 'md',
  components: {
    Button: {
      defaultProps: {
        radius: 'xl',
      },
    },
    Card: {
      defaultProps: {
        radius: 'lg',
        shadow: 'sm',
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
      },
    },
    PasswordInput: {
      defaultProps: {
        radius: 'md',
      },
    },
    Textarea: {
      defaultProps: {
        radius: 'md',
      },
    },
  },
});
