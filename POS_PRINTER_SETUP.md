# Chapati 35 automatic POS printer setup

The implementation is split between:

- `backend/utils/firebase.js`: Firebase Admin initialization and the data-only FCM sender.
- `backend/controllers/bookingController.js`: sends a print job after a pickup order is saved.
- `pos_printer_app/lib/main.dart`: Firebase registration, foreground/background handlers, and one-time setup UI.
- `pos_printer_app/lib/receipt_printer.dart`: paired-printer reconnect, duplicate protection, and the 80 mm ESC/POS receipt.
- `pos_printer_app/android/app/src/main/AndroidManifest.xml`: Android Bluetooth/network/wake permissions.

## 1. Create the Flutter project and install packages

These commands were used to create the checked-in app:

```powershell
flutter create --platforms=android --org com.chapati35 pos_printer_app
cd pos_printer_app
flutter pub add firebase_core firebase_messaging print_bluetooth_thermal esc_pos_utils_plus
flutter pub add permission_handler shared_preferences
```

The last two packages request Android 12+ runtime Bluetooth permission and save the selected printer MAC address.

## 2. Connect the app to Firebase

Create or select a Firebase project, then enable the **Firebase Cloud Messaging API**. From a terminal:

```powershell
npm install -g firebase-tools
firebase login
dart pub global activate flutterfire_cli
cd pos_printer_app
flutterfire configure --platforms=android
```

When prompted, select the Firebase project and use Android package name:

```text
com.chapati35.pos_printer_app
```

`flutterfire configure` creates the project-specific Firebase configuration and applies the Android Google Services Gradle setup. Do not try to run the app before completing this step.

## 3. Configure Firebase Admin on the server

The dependency is already installed. For a fresh checkout:

```powershell
cd backend
npm install
```

In Firebase Console, open **Project settings > Service accounts**, generate a private key, and store it outside this repository. Locally, set:

```dotenv
GOOGLE_APPLICATION_CREDENTIALS=C:\secure\chapati35-firebase-service-account.json
FIREBASE_PROJECT_ID=your-firebase-project-id
```

For a host that cannot mount a credential file, base64-encode the entire service-account JSON and set `FIREBASE_SERVICE_ACCOUNT_BASE64` instead of `GOOGLE_APPLICATION_CREDENTIALS`. `FIREBASE_SERVICE_ACCOUNT_JSON` is also supported. Never commit the private service-account JSON.

Current FlutterFire registers a Firebase Installation ID (FID), so the app displays that value and the server targets it with `fid`.

### Register one or more POS phones by API

The easiest method is the admin dashboard:

1. Sign in to the Chapati 35 admin website.
2. Open **POS Devices** in the sidebar.
3. Enter a recognizable device name and paste the Firebase installation ID copied from the Android app.
4. Select **Add device**. No backend restart is required.

The page also lists all registered devices and lets an administrator copy IDs, disable/enable printing, or permanently remove a device.

For direct API access, the device endpoints require the same admin Bearer token used by the admin application:

Log in locally and retain the returned token:

```powershell
$login = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:5000/api/auth/login" `
  -ContentType "application/json" `
  -Body (@{ email = "admin@example.com"; password = "your-password" } | ConvertTo-Json)

$headers = @{ Authorization = "Bearer $($login.token)" }
```

Add the ID copied from a phone:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:5000/api/admin/pos-devices" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body (@{
    firebaseId = "PASTE_ID_FROM_PHONE"
    label = "Main counter printer"
  } | ConvertTo-Json)
```

Calling the endpoint again with the same ID does not create a duplicate; it reactivates and updates that device. Add every additional phone the same way. Every active phone receives and prints every new pickup order.

List registered devices:

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:5000/api/admin/pos-devices" `
  -Headers $headers
```

Disable a device without deleting it:

```powershell
Invoke-RestMethod `
  -Method Patch `
  -Uri "http://localhost:5000/api/admin/pos-devices/MONGODB_DEVICE_ID" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body (@{ active = $false } | ConvertTo-Json)
```

Permanently remove a device:

```powershell
Invoke-RestMethod `
  -Method Delete `
  -Uri "http://localhost:5000/api/admin/pos-devices/MONGODB_DEVICE_ID" `
  -Headers $headers
```

Restart the Node server after changing environment variables. New pickup orders created through `POST /api/bookings` then trigger the print job. A Firebase or printer delivery failure is logged without turning an already-saved customer order into an HTTP failure.

## 4. Android permissions

The following declarations are already in `AndroidManifest.xml` above the `<application>` element:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WAKE_LOCK" />

<uses-permission
    android:name="android.permission.BLUETOOTH"
    android:maxSdkVersion="30" />
<uses-permission
    android:name="android.permission.BLUETOOTH_ADMIN"
    android:maxSdkVersion="30" />

<uses-permission
    android:name="android.permission.BLUETOOTH_SCAN"
    android:usesPermissionFlags="neverForLocation" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
```

`BLUETOOTH_CONNECT` and `BLUETOOTH_SCAN` are runtime permissions on Android 12+, so the app asks for Nearby Devices access on first launch. Permission dialogs cannot be shown from the background handler.

## 5. Build and install

For a connected test phone:

```powershell
cd pos_printer_app
flutter run --release
```

Or build an APK:

```powershell
flutter build apk --release
adb install -r build\app\outputs\flutter-apk\app-release.apk
```

Configure a proper Android release signing key before distributing a production APK; the generated project currently uses the debug signing configuration for release builds.

## 6. One-time physical phone setup

1. Turn on the Rongta RPP300 and load 80 mm paper.
2. In Android **Settings > Bluetooth**, pair the printer first. Common PINs are `0000` or `1234`; use the printer manual if neither works.
3. Launch **Chapati 35 POS Printer** at least once and allow Nearby Devices access.
4. Tap the paired RPP300 entry, then tap **Print test receipt**.
5. Copy the displayed Firebase installation ID and add it through `POST /api/admin/pos-devices` as shown above. No server restart is required.
6. In **Settings > Apps > Chapati 35 POS Printer > Battery**, choose **Unrestricted** or **Don't optimize**.
7. Enable the app in the phone vendor's **Auto-start/Background activity** setting. On Xiaomi, Oppo, Vivo, Huawei, OnePlus, and Samsung devices this is often separate from Android battery optimization.
8. Disable **Pause app activity if unused**, automatic permission removal, Data Saver restrictions, and any vendor “deep sleep” setting for this app. Keep Google Play services enabled and updated.
9. Leave Bluetooth on, keep the printer powered, and keep the phone connected to the internet. Press Home or turn the screen off; do not use **Force stop** in Android app settings.
10. After a phone reboot, unlock it and open the app once. After reinstalling the app or clearing its data, add its new Firebase ID through the API and remove or disable the old device record.

Test three cases before production: app visible, app backgrounded with the screen off, and app removed from Recents. Also test after several hours in Doze.

## Delivery limitations

Android will not deliver FCM to an app that the user has force-stopped until it is opened again. The background handler also has a short execution window (roughly 30 seconds), which is why connect and write operations have timeouts.

FCM documents high-priority messages as time-sensitive and user-visible, and may deprioritize repeated high-priority traffic that never produces a visible Android notification. This app intentionally follows the requested data-only/no-system-popup design, so no mobile push architecture can promise perfect delivery. For business-critical operation, keep orders server-side with a printed/acknowledged status and add a periodic reconciliation path so any missed print can be retried.
