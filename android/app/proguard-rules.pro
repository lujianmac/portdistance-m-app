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

# ---- Capacitor ----
# 插件由 JS 侧按名字反射加载，@CapacitorPlugin / @PluginMethod 成员不能被混淆。
# capacitor-android 自带 consumer 规则已覆盖大部分，这里再显式声明一层保险。
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep public class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod public <methods>;
    @com.getcapacitor.annotation.PermissionCallback <methods>;
    @com.getcapacitor.annotation.ActivityCallback <methods>;
}

# ---- Cordova（capacitor-cordova-android-plugins 模块） ----
-keep public class * extends org.apache.cordova.* {
    public <methods>;
    public <fields>;
}

# ---- WebView 与 JS 的桥接方法 ----
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ---- 崩溃堆栈还原 ----
# 保留行号：Play 控制台用上传的 mapping.txt 还原堆栈，行号缺失会看不出具体代码行。
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
