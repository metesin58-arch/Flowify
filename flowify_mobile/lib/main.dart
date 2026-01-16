import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'screens/game_screen.dart';
import 'services/ad_service.dart';
import 'services/iap_service.dart';


void main() async {
  WidgetsBinding widgetsBinding = WidgetsFlutterBinding.ensureInitialized();
  
  // Keep splash screen visible until webview is ready
  FlutterNativeSplash.preserve(widgetsBinding: widgetsBinding);

  // Initialize AdMob
  MobileAds.instance.initialize();
  AdService().loadInterstitialAd();
  AdService().loadRewardedAd();

  // Initialize IAP
  IapService().initialize();


  // Configure Fullscreen and Edge-to-Edge
  SystemChrome.setEnabledSystemUIMode(
    SystemUiMode.immersiveSticky,
    overlays: [], // Hide status bar and navigation bar
  );
  
  // Set preferred orientation if needed (optional)
  // SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);

  // Set system UI style for edge-to-edge
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    systemNavigationBarColor: Colors.transparent,
    systemNavigationBarDividerColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarIconBrightness: Brightness.light,
  ));

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flowify Game',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF121212),
        useMaterial3: true,
      ),
      home: const GameScreen(),
    );
  }
}
