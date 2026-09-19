import 'package:flutter/material.dart';

/// Global toast (snackbar) access, usable from anywhere without a context.
final GlobalKey<ScaffoldMessengerState> messengerKey = GlobalKey<ScaffoldMessengerState>();

enum ToastType { error, success, info }

void showToast(String message, [ToastType type = ToastType.info]) {
  final messenger = messengerKey.currentState;
  if (messenger == null) return;
  messenger
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(
      content: Text(message),
      duration: Duration(seconds: type == ToastType.error ? 4 : 2),
    ));
}

void toastError(Object error) => showToast(
      error is Exception || error is Error ? _clean(error.toString()) : error.toString(),
      ToastType.error,
    );

String _clean(String s) => s.replaceFirst(RegExp(r'^(Exception|Bad state): '), '');
