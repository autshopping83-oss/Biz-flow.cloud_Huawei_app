# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# --- Huawei HMS Core ProGuard/R8 rules ---
# Classes internas de dispositivos Huawei (HiAnalytics, BouncyCastle, file system)
# não existem no Android SDK comum — apenas em firmware Huawei. Suprimir warnings no R8.

# Manter classes HMS que realmente usamos (Push Kit, AGConnect framework)
-keep class com.huawei.hms.** { *; }
-keep class com.huawei.agconnect.** { *; }

# Suprimir warnings de classes ausentes em todos os sub-pacotes Huawei
-dontwarn com.huawei.android.**
-dontwarn com.huawei.hianalytics.**
-dontwarn com.huawei.libcore.**
-dontwarn com.huawei.**
-dontwarn org.bouncycastle.**

# Se o R8 ainda abortar, descomentar a linha abaixo
# -ignorewarnings
