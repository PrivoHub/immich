import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/utils/privohub_workspace.dart';

TextEditingValue _type(String before, String after) =>
    PrivoHubWorkspace.inputFormatter.formatEditUpdate(TextEditingValue(text: before), TextEditingValue(text: after));

void main() {
  group('toServerUrl', () {
    test('a workspace name becomes its Photos address', () {
      expect(PrivoHubWorkspace.toServerUrl('acme'), 'https://photos-acme.privohub.com');
      expect(PrivoHubWorkspace.toServerUrl(' My-Team2 '), 'https://photos-my-team2.privohub.com');
    });

    test('invalid workspace names give no address', () {
      expect(PrivoHubWorkspace.toServerUrl(''), isNull);
      expect(PrivoHubWorkspace.toServerUrl('acme.example.com'), isNull);
      expect(PrivoHubWorkspace.toServerUrl('a' * 33), isNull);
    });
  });

  group('fromServerUrl', () {
    test('any PrivoHub address reduces to the workspace name', () {
      expect(PrivoHubWorkspace.fromServerUrl('https://photos-acme.privohub.com'), 'acme');
      expect(PrivoHubWorkspace.fromServerUrl('https://photos-acme.privohub.com/api'), 'acme');
      expect(PrivoHubWorkspace.fromServerUrl('photos-acme.privohub.com/'), 'acme');
      expect(PrivoHubWorkspace.fromServerUrl('https://drive-acme.privohub.com'), 'acme');
      expect(PrivoHubWorkspace.fromServerUrl('acme.privohub.com'), 'acme');
      expect(PrivoHubWorkspace.fromServerUrl('ACME'), 'acme');
    });

    test('other addresses give no workspace name', () {
      expect(PrivoHubWorkspace.fromServerUrl('https://photos.example.com'), '');
      expect(PrivoHubWorkspace.fromServerUrl('https://photos-acme.privohub.com/albums'), '');
    });
  });

  group('inputFormatter', () {
    test('keeps lowercase letters, digits and hyphens', () {
      expect(_type('acm', 'acmE').text, 'acme');
      expect(_type('acme', 'acme.').text, 'acme');
      expect(_type('acme', 'acme_1').text, 'acme1');
    });

    test('a pasted address becomes the workspace name', () {
      expect(_type('', 'https://photos-acme.privohub.com').text, 'acme');
    });

    test('stops at the maximum length', () {
      expect(_type('a' * 32, 'a' * 33).text.length, PrivoHubWorkspace.maxLength);
    });
  });
}
