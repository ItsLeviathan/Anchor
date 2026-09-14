import React, { Component, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Anchor] Unhandled render error:', error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            Your data is safe. Nothing was lost — please try again.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Try again"
            style={({ pressed }) => [styles.button, { opacity: pressed ? 0.8 : 1 }]}
            onPress={this.reset}
          >
            <Text style={styles.buttonLabel}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#FAFAF8',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B6B66',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#2F6F5E',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
