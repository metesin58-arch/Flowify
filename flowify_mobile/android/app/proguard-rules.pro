# Flutter WebView
-keepclassmembers class * extends android.webkit.WebChromeClient {
   public void openFileChooser(...);
}

# Google Mobile Ads
-keep public class com.google.android.gms.ads.** { *; }
-keep public class com.google.ads.** { *; }

# WebView Bridge
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
