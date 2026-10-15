import 'package:flutter/material.dart';
import 'package:immich_mobile/utils/privohub_workspace.dart';

/// Server field for the login screen. The user types only the workspace name; the fixed
/// `photos-` prefix and `.privohub.com` suffix sit right next to it as it grows.
class PrivoHubWorkspaceInput extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final String hintText;
  final String? Function(String value) validator;
  final void Function(String value)? onSubmit;

  const PrivoHubWorkspaceInput({
    super.key,
    required this.controller,
    required this.label,
    required this.hintText,
    required this.validator,
    this.onSubmit,
  });

  @override
  State<PrivoHubWorkspaceInput> createState() => _PrivoHubWorkspaceInputState();
}

class _PrivoHubWorkspaceInputState extends State<PrivoHubWorkspaceInput> {
  final _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(_onFocusChange);
  }

  @override
  void dispose() {
    _focusNode.removeListener(_onFocusChange);
    _focusNode.dispose();
    super.dispose();
  }

  void _onFocusChange() => setState(() {});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final style = theme.textTheme.bodyLarge;
    return FormField<String>(
      validator: (_) => widget.validator(widget.controller.text),
      builder: (field) => GestureDetector(
        // Tapping the fixed parts focuses the name, as if they were one field.
        behavior: HitTestBehavior.opaque,
        onTap: _focusNode.requestFocus,
        child: InputDecorator(
          decoration: InputDecoration(
            labelText: widget.label,
            errorText: field.errorText,
          ).applyDefaults(theme.inputDecorationTheme),
          isFocused: _focusNode.hasFocus,
          isEmpty: false,
          child: Row(
            children: [
              Text(PrivoHubWorkspace.hostPrefix, style: style),
              Flexible(
                child: IntrinsicWidth(
                  child: TextField(
                    controller: widget.controller,
                    focusNode: _focusNode,
                    style: style,
                    decoration: InputDecoration.collapsed(hintText: widget.hintText),
                    keyboardType: TextInputType.url,
                    textInputAction: TextInputAction.next,
                    autocorrect: false,
                    enableSuggestions: false,
                    inputFormatters: [PrivoHubWorkspace.inputFormatter],
                    onChanged: (_) {
                      if (field.hasError) {
                        field.validate();
                      }
                    },
                    onSubmitted: widget.onSubmit,
                    onTapOutside: (_) => _focusNode.unfocus(),
                  ),
                ),
              ),
              Text(PrivoHubWorkspace.hostSuffix, style: style),
            ],
          ),
        ),
      ),
    );
  }
}
