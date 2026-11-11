import 'dart:async';
import 'dart:ui';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'receipt_printer.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  WidgetsFlutterBinding.ensureInitialized();
  DartPluginRegistrant.ensureInitialized();
  await Firebase.initializeApp();

  try {
    await ReceiptPrinter.printMessage(message.data);
  } catch (error, stackTrace) {
    debugPrint('Background receipt print failed: $error\n$stackTrace');
  }
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  runApp(const PosPrinterApp());
}

class PosPrinterApp extends StatelessWidget {
  const PosPrinterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'POS Printer',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF087CA7),
          brightness: Brightness.light,
        ),
        scaffoldBackgroundColor: const Color(0xFFF5F7FA),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.transparent,
          surfaceTintColor: Colors.transparent,
          elevation: 0,
        ),
        useMaterial3: true,
      ),
      home: const PrinterSetupPage(),
    );
  }
}

class PrinterSetupPage extends StatefulWidget {
  const PrinterSetupPage({super.key});

  @override
  State<PrinterSetupPage> createState() => _PrinterSetupPageState();
}

class _PrinterSetupPageState extends State<PrinterSetupPage> {
  List<BluetoothInfo> _devices = const [];
  String? _selectedMac;
  String? _selectedName;
  String? _firebaseId;
  String _firebaseStatus = 'Registering with Firebase...';
  String _status = 'Starting...';
  bool _busy = false;
  bool _showPrinterList = false;
  StreamSubscription<RemoteMessage>? _foregroundSubscription;
  StreamSubscription<String>? _tokenSubscription;
  StreamSubscription<String>? _legacyTokenSubscription;

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    final prefs = await SharedPreferences.getInstance();
    _selectedMac = prefs.getString(ReceiptPrinter.printerMacKey);
    _selectedName = prefs.getString(ReceiptPrinter.printerNameKey);
    _showPrinterList = _selectedMac == null;

    // Android 12+ Bluetooth permissions must be granted while the UI is open.
    await [Permission.bluetoothScan, Permission.bluetoothConnect].request();
    await FirebaseMessaging.instance.requestPermission();

    await _registerFirebaseMessaging();
    _foregroundSubscription = FirebaseMessaging.onMessage.listen((
      message,
    ) async {
      try {
        await ReceiptPrinter.printMessage(message.data);
        if (mounted) setState(() => _status = 'Order printed successfully');
      } catch (error) {
        if (mounted) setState(() => _status = 'Print failed: $error');
      }
    });
    await _refreshDevices();
  }

  Future<void> _registerFirebaseMessaging() async {
    _tokenSubscription = FirebaseMessaging.instance.onRegistered.listen((id) {
      if (!mounted) return;
      setState(() {
        _firebaseId = 'fid:$id';
        _firebaseStatus = 'Firebase registration ready (installation ID).';
      });
    });

    // Keep a token target updated on devices where the newer FID callback is
    // unavailable or delayed by the installed Google Play services version.
    // ignore: deprecated_member_use
    _legacyTokenSubscription = FirebaseMessaging.instance.onTokenRefresh.listen(
      (token) {
        if (!mounted || _firebaseId?.startsWith('fid:') == true) return;
        setState(() {
          _firebaseId = 'token:$token';
          _firebaseStatus = 'Firebase registration ready (FCM token).';
        });
      },
    );

    Object? registrationError;
    try {
      await FirebaseMessaging.instance.register().timeout(
        const Duration(seconds: 15),
      );
      await Future<void>.delayed(const Duration(seconds: 2));
    } catch (error) {
      registrationError = error;
    }

    if (_firebaseId != null) return;

    try {
      // Compatibility fallback while Firebase completes the FID migration.
      // ignore: deprecated_member_use
      final token = await FirebaseMessaging.instance.getToken().timeout(
        const Duration(seconds: 15),
      );
      if (token == null || token.isEmpty) {
        throw StateError('Firebase returned an empty registration token');
      }
      if (!mounted) return;
      setState(() {
        _firebaseId = 'token:$token';
        _firebaseStatus = 'Firebase registration ready (FCM token).';
      });
    } catch (tokenError) {
      if (!mounted) return;
      setState(() {
        _firebaseStatus =
            'Firebase registration failed: ${registrationError ?? tokenError}';
      });
    }
  }

  Future<void> _refreshDevices() async {
    setState(() {
      _busy = true;
      _status = 'Reading paired Bluetooth devices...';
    });
    try {
      final devices = await ReceiptPrinter.pairedPrinters();
      if (!mounted) return;
      setState(() {
        _devices = devices;
        if (_selectedMac == null) _showPrinterList = true;
        _status = devices.isEmpty
            ? 'Pair the Rongta printer in Android Bluetooth settings first.'
            : _selectedMac == null
            ? 'Select the Rongta RPP300 printer below.'
            : '${_selectedName ?? 'Printer'} is ready.';
      });
    } catch (error) {
      if (mounted) setState(() => _status = 'Bluetooth error: $error');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _selectPrinter(BluetoothInfo printer) async {
    setState(() {
      _busy = true;
      _status = 'Connecting to ${printer.name}...';
    });
    try {
      if (await PrintBluetoothThermal.connectionStatus) {
        await PrintBluetoothThermal.disconnect;
      }
      final connected = await PrintBluetoothThermal.connect(
        macPrinterAddress: printer.macAdress,
      ).timeout(const Duration(seconds: 12));
      if (!connected) throw StateError('Connection failed');
      await ReceiptPrinter.savePrinter(printer);
      if (!mounted) return;
      setState(() {
        _selectedMac = printer.macAdress;
        _selectedName = printer.name;
        _showPrinterList = false;
        _status = '${printer.name} is selected and connected.';
      });
    } catch (error) {
      if (mounted) setState(() => _status = 'Connection failed: $error');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _testPrint() async {
    setState(() {
      _busy = true;
      _status = 'Printing test receipt...';
    });
    try {
      await ReceiptPrinter.printMessage({
        'orderId': 'TEST-${DateTime.now().millisecondsSinceEpoch}',
        'customerName': 'Test Customer',
        'items':
            '[{"label":"Chicken Chapati","qty":2,"price":8.50},'
            '{"label":"Mango Lassi","qty":1,"price":4.00}]',
        'totalAmount': '21.00',
      });
      if (mounted) setState(() => _status = 'Test receipt printed.');
    } catch (error) {
      if (mounted) setState(() => _status = 'Test print failed: $error');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  void dispose() {
    _foregroundSubscription?.cancel();
    _tokenSubscription?.cancel();
    _legacyTokenSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final hasPrinter = _selectedMac != null;
    final firebaseReady = _firebaseId != null;
    final statusIsError =
        _status.toLowerCase().contains('failed') ||
        _status.toLowerCase().contains('error');

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'POS Printer',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(18, 8, 18, 28),
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF075B82), Color(0xFF0E91BD)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x33075B82),
                    blurRadius: 22,
                    offset: Offset(0, 10),
                  ),
                ],
              ),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(18),
                    child: Image.asset(
                      'assets/icon/app_icon.png',
                      width: 76,
                      height: 76,
                      fit: BoxFit.cover,
                    ),
                  ),
                  const SizedBox(width: 16),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Receipt Station',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        SizedBox(height: 5),
                        Text(
                          'Automatic Bluetooth order printing',
                          style: TextStyle(
                            color: Color(0xFFD9F4FF),
                            height: 1.3,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: statusIsError
                    ? colors.errorContainer
                    : const Color(0xFFEAF8F1),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  Icon(
                    statusIsError
                        ? Icons.error_outline
                        : _busy
                        ? Icons.sync
                        : Icons.check_circle_outline,
                    color: statusIsError
                        ? colors.onErrorContainer
                        : const Color(0xFF087A4D),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      _status,
                      style: TextStyle(
                        color: statusIsError
                            ? colors.onErrorContainer
                            : const Color(0xFF075E3D),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            if (_busy) ...[
              const SizedBox(height: 8),
              const LinearProgressIndicator(
                borderRadius: BorderRadius.all(Radius.circular(8)),
              ),
            ],
            const SizedBox(height: 18),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFE3E8EF)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(9),
                        decoration: BoxDecoration(
                          color: colors.primaryContainer,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          Icons.print_outlined,
                          color: colors.primary,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Bluetooth printer',
                              style: TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            Text(
                              'Your saved receipt printer',
                              style: TextStyle(color: Color(0xFF667085)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 15),
                  if (hasPrinter)
                    Container(
                      padding: const EdgeInsets.all(13),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF0FBF6),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFBDEAD3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.check_circle,
                            color: Color(0xFF078653),
                          ),
                          const SizedBox(width: 11),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _selectedName ?? 'Selected printer',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                Text(
                                  _selectedMac!,
                                  style: const TextStyle(
                                    color: Color(0xFF667085),
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          TextButton(
                            onPressed: _busy
                                ? null
                                : () => setState(
                                    () => _showPrinterList = !_showPrinterList,
                                  ),
                            child: Text(_showPrinterList ? 'Hide' : 'Change'),
                          ),
                        ],
                      ),
                    ),
                  if (!hasPrinter || _showPrinterList) ...[
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        const Expanded(
                          child: Text(
                            'Paired devices',
                            style: TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ),
                        IconButton.filledTonal(
                          onPressed: _busy ? null : _refreshDevices,
                          icon: const Icon(Icons.refresh),
                          tooltip: 'Refresh devices',
                        ),
                      ],
                    ),
                    if (_devices.isEmpty)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 16),
                        child: Text(
                          'No paired devices found. Pair the printer in Android settings, then refresh.',
                          style: TextStyle(color: Color(0xFF667085)),
                        ),
                      )
                    else
                      for (final device in _devices)
                        Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Material(
                            color: _selectedMac == device.macAdress
                                ? colors.primaryContainer.withValues(
                                    alpha: 0.45,
                                  )
                                : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(14),
                            child: ListTile(
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                              leading: CircleAvatar(
                                backgroundColor: Colors.white,
                                child: Icon(
                                  Icons.bluetooth,
                                  color: colors.primary,
                                ),
                              ),
                              title: Text(
                                device.name,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              subtitle: Text(device.macAdress),
                              trailing: _selectedMac == device.macAdress
                                  ? const Icon(
                                      Icons.check_circle,
                                      color: Color(0xFF078653),
                                    )
                                  : const Icon(Icons.chevron_right),
                              onTap: _busy
                                  ? null
                                  : () => _selectPrinter(device),
                            ),
                          ),
                        ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(54),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              onPressed: _busy || !hasPrinter ? null : _testPrint,
              icon: const Icon(Icons.receipt_long),
              label: const Text(
                'Print test receipt',
                style: TextStyle(fontWeight: FontWeight.w800),
              ),
            ),
            const SizedBox(height: 14),
            Card(
              elevation: 0,
              color: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(18),
                side: const BorderSide(color: Color(0xFFE3E8EF)),
              ),
              child: ExpansionTile(
                leading: Icon(
                  firebaseReady
                      ? Icons.cloud_done_outlined
                      : Icons.cloud_sync_outlined,
                  color: firebaseReady
                      ? const Color(0xFF078653)
                      : colors.primary,
                ),
                title: const Text(
                  'Server registration',
                  style: TextStyle(fontWeight: FontWeight.w800),
                ),
                subtitle: Text(
                  firebaseReady
                      ? 'Ready to receive new orders'
                      : _firebaseStatus,
                ),
                childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                children: [
                  const Divider(),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(_firebaseStatus),
                  ),
                  const SizedBox(height: 8),
                  SelectableText(
                    _firebaseId ?? 'Waiting for Firebase registration...',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF667085),
                    ),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: _firebaseId == null
                          ? null
                          : () async {
                              await Clipboard.setData(
                                ClipboardData(text: _firebaseId!),
                              );
                              if (!context.mounted) return;
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Firebase messaging target copied',
                                  ),
                                ),
                              );
                            },
                      icon: const Icon(Icons.copy),
                      label: const Text('Copy ID for server'),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.bolt, size: 17, color: Color(0xFF98A2B3)),
                SizedBox(width: 5),
                Text(
                  'Automatic printing remains active in the background',
                  style: TextStyle(color: Color(0xFF98A2B3), fontSize: 12),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
