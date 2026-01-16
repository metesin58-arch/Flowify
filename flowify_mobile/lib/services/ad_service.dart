import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:flutter/foundation.dart';

class AdService {
  static final AdService _instance = AdService._internal();
  factory AdService() => _instance;
  AdService._internal();

  InterstitialAd? _interstitialAd;
  RewardedAd? _rewardedAd;

  // Using test IDs as requested
  static String get interstitialAdUnitId {
    if (kIsWeb) return "";
    if (defaultTargetPlatform == TargetPlatform.android) {
      return "ca-app-pub-3940256099942544/1033173712";
    } else if (defaultTargetPlatform == TargetPlatform.iOS) {
      return "ca-app-pub-3940256099942544/4411468910";
    }
    return "";
  }

  static String get rewardedAdUnitId {
    if (kIsWeb) return "";
    if (defaultTargetPlatform == TargetPlatform.android) {
      return "ca-app-pub-3940256099942544/5224354917";
    } else if (defaultTargetPlatform == TargetPlatform.iOS) {
      return "ca-app-pub-3940256099942544/1712485313";
    }
    return "";
  }


  void loadInterstitialAd() {
    InterstitialAd.load(
      adUnitId: interstitialAdUnitId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (ad) {
          _interstitialAd = ad;
        },
        onAdFailedToLoad: (error) {
          _interstitialAd = null;
        },
      ),
    );
  }

  void showInterstitialAd() {
    if (_interstitialAd != null) {
      _interstitialAd!.show();
      _interstitialAd = null;
      loadInterstitialAd(); // Load next one
    } else {
      loadInterstitialAd();
    }
  }

  void loadRewardedAd() {
    RewardedAd.load(
      adUnitId: rewardedAdUnitId,
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (ad) {
          _rewardedAd = ad;
        },
        onAdFailedToLoad: (error) {
          _rewardedAd = null;
        },
      ),
    );
  }

  void showRewardedAd(Function(RewardItem) onReward) {
    if (_rewardedAd != null) {
      _rewardedAd!.show(onUserEarnedReward: (AdWithoutView ad, RewardItem reward) {
        onReward(reward);
      });
      _rewardedAd = null;
      loadRewardedAd();
    } else {
      loadRewardedAd();
    }
  }
}
