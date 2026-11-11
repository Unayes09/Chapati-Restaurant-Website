import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pos_printer_app/main.dart';

void main() {
  test('creates the POS printer application', () {
    expect(const PosPrinterApp(), isA<Widget>());
  });
}
