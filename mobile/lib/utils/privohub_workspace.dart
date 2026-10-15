import 'package:flutter/services.dart';

/// Every PrivoHub Photos server lives at https://photos-{workspace}.privohub.com, so the
/// login screen asks only for the workspace name and builds the server address from it.
abstract final class PrivoHubWorkspace {
  static const hostPrefix = 'photos-';
  static const hostSuffix = '.privohub.com';
  static const maxLength = 32;

  static final _workspace = RegExp(r'^[a-z0-9-]{1,32}$');

  // Accepts a bare workspace name or any PrivoHub address for it: the Photos or Drive
  // host, or the workspace launcher, with or without scheme, /api and trailing slash.
  static final _address = RegExp(
    r'^(?:https?://)?(?:photos-|drive-)?([a-z0-9-]{1,32})(?:\.privohub\.com)?(?:/api)?/?$',
    caseSensitive: false,
  );

  /// The server address for [workspace], or null if it is not a valid workspace name.
  static String? toServerUrl(String workspace) {
    final name = workspace.trim().toLowerCase();
    return _workspace.hasMatch(name) ? 'https://$hostPrefix$name$hostSuffix' : null;
  }

  /// The workspace name in a typed or stored address, or an empty string if there is none.
  static String fromServerUrl(String url) => _address.firstMatch(url.trim())?.group(1)?.toLowerCase() ?? '';

  /// Keeps the field to lowercase letters, digits and hyphens. A pasted address
  /// ("https://photos-acme.privohub.com") is reduced to its workspace name.
  static final TextInputFormatter inputFormatter = TextInputFormatter.withFunction((oldValue, newValue) {
    final pasted = newValue.text.length - oldValue.text.length > 1 ? fromServerUrl(newValue.text) : '';
    var kept = pasted.isNotEmpty ? pasted : newValue.text.toLowerCase().replaceAll(RegExp(r'[^a-z0-9-]'), '');
    if (kept.length > maxLength) {
      kept = kept.substring(0, maxLength);
    }
    if (kept == newValue.text) {
      return newValue;
    }
    return TextEditingValue(
      text: kept,
      selection: TextSelection.collapsed(offset: kept.length),
    );
  });
}
