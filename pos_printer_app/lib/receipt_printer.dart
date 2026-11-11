import 'dart:convert';

import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ReceiptPrinter {
  static const printerMacKey = 'printer_mac';
  static const printerNameKey = 'printer_name';
  static const printedOrdersKey = 'printed_order_ids';

  static Future<List<BluetoothInfo>> pairedPrinters() {
    return PrintBluetoothThermal.pairedBluetooths.timeout(
      const Duration(seconds: 10),
    );
  }

  static Future<void> savePrinter(BluetoothInfo printer) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(printerMacKey, printer.macAdress);
    await prefs.setString(printerNameKey, printer.name);
  }

  static Future<void> printMessage(Map<String, dynamic> data) async {
    final normalized = data.map(
      (key, value) => MapEntry(key, value?.toString() ?? ''),
    );
    final orderId = normalized['orderId'] ?? '';
    final prefs = await SharedPreferences.getInstance();
    await prefs.reload();

    final printed = prefs.getStringList(printedOrdersKey) ?? <String>[];
    if (orderId.isNotEmpty && printed.contains(orderId)) {
      debugPrint('Skipping duplicate print for order $orderId');
      return;
    }

    final printer = await _resolvePrinter(prefs);
    await _connect(printer.macAdress);
    final bytes = await buildReceipt(normalized);
    final success = await PrintBluetoothThermal.writeBytes(
      bytes,
    ).timeout(const Duration(seconds: 12));
    if (!success) throw StateError('The printer rejected the receipt bytes');

    if (orderId.isNotEmpty) {
      final updated = <String>[
        orderId,
        ...printed,
      ].take(100).toList(growable: false);
      await prefs.setStringList(printedOrdersKey, updated);
    }
  }

  static Future<BluetoothInfo> _resolvePrinter(SharedPreferences prefs) async {
    final devices = await pairedPrinters();
    if (devices.isEmpty) {
      throw StateError('No paired Bluetooth devices were found');
    }

    final savedMac = prefs.getString(printerMacKey)?.toUpperCase();
    for (final device in devices) {
      if (savedMac != null && device.macAdress.toUpperCase() == savedMac) {
        return device;
      }
    }

    // First-run fallback for the common names advertised by Rongta printers.
    for (final device in devices) {
      final name = device.name.toUpperCase();
      if (name.contains('RPP300') ||
          name.contains('RPP-300') ||
          name.contains('RONGTA')) {
        await savePrinter(device);
        return device;
      }
    }

    throw StateError(
      'Rongta printer is not selected. Open the app and select it once.',
    );
  }

  static Future<void> _connect(String macAddress) async {
    if (await PrintBluetoothThermal.connectionStatus) return;
    final connected = await PrintBluetoothThermal.connect(
      macPrinterAddress: macAddress,
    ).timeout(const Duration(seconds: 12));
    if (!connected) throw StateError('Could not connect to $macAddress');
  }

  static Future<List<int>> buildReceipt(Map<String, String> data) async {
    final profile = await CapabilityProfile.load();
    final generator = Generator(PaperSize.mm80, profile);
    final bytes = <int>[];
    final orderId = data['orderId'] ?? '-';
    final customer = data['customerName'] ?? '-';
    final total = _money(data['totalAmount']);
    final items = _decodeItems(data['items']);

    bytes.addAll(generator.reset());
    bytes.addAll(
      generator.text(
        'CHAPATI',
        styles: const PosStyles(
          align: PosAlign.center,
          bold: true,
          width: PosTextSize.size2,
          height: PosTextSize.size2,
        ),
      ),
    );
    bytes.addAll(
      generator.text(
        'Indian street food in Saint-Malo',
        styles: const PosStyles(align: PosAlign.center),
      ),
    );
    bytes.addAll(
      generator.text(
        'NEW PICKUP ORDER',
        styles: const PosStyles(align: PosAlign.center, bold: true),
        linesAfter: 1,
      ),
    );
    bytes.addAll(generator.text('Order: $orderId'));
    bytes.addAll(generator.text('Customer: $customer'));
    bytes.addAll(generator.hr());
    bytes.addAll(
      generator.text(
        _singleLineColumns('ITEM', 'EUR'),
        styles: const PosStyles(bold: true),
        maxCharsPerLine: 42,
      ),
    );

    for (final item in items) {
      final qty = _number(item['qty'], fallback: 1);
      final unitPrice = _number(item['price']);
      final label = _asciiSafe(item['label']?.toString() ?? 'Item');
      final itemLines = _itemPriceLines(
        '${_quantity(qty)} x $label',
        (qty * unitPrice).toStringAsFixed(2),
      );
      for (final line in itemLines) {
        bytes.addAll(generator.text(line, maxCharsPerLine: 42));
      }
    }

    bytes.addAll(generator.hr());
    bytes.addAll(
      generator.text(
        _singleLineColumns('TOTAL', '$total EUR'),
        styles: const PosStyles(bold: true),
        maxCharsPerLine: 42,
      ),
    );
    bytes.addAll(
      generator.text(
        'Thank you',
        styles: const PosStyles(align: PosAlign.center),
        linesAfter: 1,
      ),
    );
    bytes.addAll(generator.feed(3));
    // The RPP300 uses ESC/POS. Models with only a tear bar safely ignore cut.
    bytes.addAll(generator.cut(mode: PosCutMode.partial));
    return bytes;
  }

  static List<Map<String, dynamic>> _decodeItems(String? raw) {
    try {
      final decoded = jsonDecode(raw ?? '[]');
      if (decoded is! List) return const [];
      return decoded
          .whereType<Map>()
          .map((item) => Map<String, dynamic>.from(item))
          .toList();
    } catch (_) {
      return const [];
    }
  }

  static double _number(Object? value, {double fallback = 0}) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? fallback;
  }

  static String _money(String? value) => _number(value).toStringAsFixed(2);

  static String _quantity(double value) =>
      value == value.roundToDouble() ? value.toInt().toString() : '$value';

  static String _singleLineColumns(
    String left,
    String right, {
    int width = 42,
  }) {
    final safeRight = right.length >= width ? right.substring(0, width) : right;
    final leftWidth = width - safeRight.length;
    final safeLeft = left.length > leftWidth
        ? left.substring(0, leftWidth)
        : left;
    return '${safeLeft.padRight(leftWidth)}$safeRight';
  }

  static List<String> _itemPriceLines(
    String item,
    String price, {
    int width = 42,
  }) {
    final right = '$price EUR';
    final leftWidth = width - right.length - 1;
    final words = item.trim().split(RegExp(r'\s+'));
    final chunks = <String>[];
    var current = '';

    for (final word in words) {
      if (word.length > leftWidth) {
        if (current.isNotEmpty) {
          chunks.add(current);
          current = '';
        }
        for (var start = 0; start < word.length; start += leftWidth) {
          chunks.add(
            word.substring(
              start,
              start + leftWidth < word.length ? start + leftWidth : word.length,
            ),
          );
        }
        continue;
      }

      final candidate = current.isEmpty ? word : '$current $word';
      if (candidate.length <= leftWidth) {
        current = candidate;
      } else {
        chunks.add(current);
        current = word;
      }
    }
    if (current.isNotEmpty) chunks.add(current);
    if (chunks.isEmpty) chunks.add('Item');

    return [
      '${chunks.first.padRight(leftWidth)} $right',
      for (final continuation in chunks.skip(1)) continuation,
    ];
  }

  // The printer's default code page is not guaranteed to support Unicode.
  static String _asciiSafe(String value) =>
      value.replaceAll('€', 'EUR').replaceAll(RegExp(r'[^\x20-\x7E]'), '?');
}
