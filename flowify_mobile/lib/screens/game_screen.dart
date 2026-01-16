import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'dart:io';
import '../services/ad_service.dart';
import '../services/iap_service.dart';


class GameScreen extends StatefulWidget {
  const GameScreen({super.key});

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;
  bool _hasError = false;

  // Replace with your Netlify URL or fetch from Remote Config
  final String _gameUrl = "https://flowifyv01.netlify.app/"; 

  @override
  void initState() {
    super.initState();

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0x00000000)) // Transparent background
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            // Update loading bar.
          },
          onPageStarted: (String url) {},
          onPageFinished: (String url) {
            setState(() {
              _isLoading = false;
            });
            // Inject a flag to help JS detect Flutter
            _controller.runJavaScript('window.isFlutter = true;');
            
            // CRITICAL: Remove splash screen only after webview is loaded
            FlutterNativeSplash.remove();
          },
          onWebResourceError: (WebResourceError error) {
            debugPrint('WebView error: ${error.description}');
            if (error.errorType != WebResourceErrorType.unknown) {
              setState(() {
                _hasError = true;
              });
              FlutterNativeSplash.remove();
            }
          },
        ),
      )
      ..addJavaScriptChannel(
        'FlutterBridge',
        onMessageReceived: (JavaScriptMessage message) {
          _handleMessage(message.message);
        },
      )
      ..addJavaScriptChannel(
        'PurchaseChannel',
        onMessageReceived: (JavaScriptMessage message) {
          IapService().buyProduct(message.message);
        },
      )
      ..loadRequest(Uri.parse(_gameUrl));

    // Setup IAP Callbacks
    IapService().onPurchaseSuccess = (productId) {
      // User specifically requested onPurchaseResult with a result object
      _controller.runJavaScript('if(window.onPurchaseResult) window.onPurchaseResult({ "success": true, "productId": "$productId" })');
      // Backup/Compatibility for the game's existing logic
      _controller.runJavaScript('if(window.odulVer) window.odulVer("$productId")');
    };
    IapService().onPurchaseError = (error) {
      _controller.runJavaScript('if(window.onPurchaseResult) window.onPurchaseResult({ "success": false, "error": "$error" })');
      debugPrint('IAP Error: $error');
    };


    // Platform specific settings
    if (Platform.isIOS) {
      // iOS specific scroll settings if needed
    }
  }

  void _handleMessage(String message) {
    debugPrint('Message from JS: $message');
    
    if (message == "show_interstitial") {
      AdService().showInterstitialAd();
    } else if (message == "show_rewarded") {
      AdService().showRewardedAd((reward) {
        // Send a generic rewarded_ad ID to trigger the reward in App.tsx
        _controller.runJavaScript('if(window.odulVer) window.odulVer("rewarded_ad")');
      });
    } else if (message == "vibrate") {
      HapticFeedback.mediumImpact();
    }
  }


  @override
  Widget build(BuildContext context) {
    // We do NOT use SafeArea to ensure true fullscreen
    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_hasError)
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.wifi_off, size: 64, color: Colors.white54),
                  const SizedBox(height: 16),
                  const Text(
                    "İnternet bağlantısı yok",
                    style: TextStyle(color: Colors.white, fontSize: 18),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      setState(() {
                        _hasError = false;
                        _isLoading = true;
                      });
                      _controller.loadRequest(Uri.parse(_gameUrl));
                    },
                    child: const Text("Tekrar Dene"),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
