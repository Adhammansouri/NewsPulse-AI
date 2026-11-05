# Board index · كل لوحة في التصميم

كل سطر = لوحة في الـ Canvas. الصورة في `design/screens/<board>.jpg` والمصدر في `design/reference/<board>.dc.html`.
لوحات «الحالات» عبارة عن نفس المكوّن (`Component`) مع `state` مختلف: افتح ملف المكوّن الأساسي واقرأ فرع `sc-if` الخاص بالحالة.

| Sprint | Board | العنوان | المقاس | المكوّن الأساسي | الحالة |
|---|---|---|---|---|---|
| S01 | [`DesignSystem`](screens/DesignSystem.jpg) | Design System v4 | Desktop 1440 | `DesignSystem` | default |
| S01 | [`Motion`](screens/Motion.jpg) | الحركة · تفاعلي | Desktop 1440 | `Motion` | default |
| S02 | [`Splash`](screens/Splash.jpg) | التحقق من الجلسة | Desktop 1440 | `Splash` | default |
| S02 | [`Splash-offline`](screens/Splash-offline.jpg) | بدون اتصال · صفحة كاملة | Desktop 1440 | `Splash` | offline |
| S02 | [`MobSplash`](screens/MobSplash.jpg) | التحقق من الجلسة | Mobile 390 | `MobSplash` | default |
| S02 | [`MobSplash-offline`](screens/MobSplash-offline.jpg) | بدون اتصال · صفحة كاملة | Mobile 390 | `MobSplash` | offline |
| S02 | [`MobMore`](screens/MobMore.jpg) | المزيد | Mobile 390 | `MobMore` | default |
| S02 | [`RouteLoader`](screens/RouteLoader.jpg) | لودر التنقل · تفاعلي | Desktop 1440 | `RouteLoader` | default |
| S03 | [`DeskLogin`](screens/DeskLogin.jpg) | تسجيل الدخول · تفاعلي | Desktop 1440 | `DeskLogin` | default |
| S03 | [`DeskLogin-validation`](screens/DeskLogin-validation.jpg) | حقول فاضية | Desktop 1440 | `DeskLogin` | validation |
| S03 | [`DeskLogin-error`](screens/DeskLogin-error.jpg) | بيانات غلط | Desktop 1440 | `DeskLogin` | error |
| S03 | [`DeskLogin-network`](screens/DeskLogin-network.jpg) | السيرفر مش متاح | Desktop 1440 | `DeskLogin` | network |
| S03 | [`DeskLogin-locked`](screens/DeskLogin-locked.jpg) | محاولات كتير | Desktop 1440 | `DeskLogin` | locked |
| S03 | [`DeskLogin-forgot`](screens/DeskLogin-forgot.jpg) | نسيت كلمة المرور | Desktop 1440 | `DeskLogin` | forgot |
| S03 | [`DeskLogin-english`](screens/DeskLogin-english.jpg) | English · LTR | Desktop 1440 | `DeskLogin` | english |
| S03 | [`MobLogin`](screens/MobLogin.jpg) | تسجيل الدخول | Mobile 390 | `MobLogin` | default |
| S03 | [`MobLogin-validation`](screens/MobLogin-validation.jpg) | حقول فاضية | Mobile 390 | `MobLogin` | validation |
| S03 | [`MobLogin-error`](screens/MobLogin-error.jpg) | بيانات غلط | Mobile 390 | `MobLogin` | error |
| S03 | [`MobLogin-network`](screens/MobLogin-network.jpg) | السيرفر مش متاح | Mobile 390 | `MobLogin` | network |
| S03 | [`MobLogin-locked`](screens/MobLogin-locked.jpg) | محاولات كتير | Mobile 390 | `MobLogin` | locked |
| S03 | [`MobLogin-forgot`](screens/MobLogin-forgot.jpg) | نسيت كلمة المرور | Mobile 390 | `MobLogin` | forgot |
| S03 | [`MobLogin-english`](screens/MobLogin-english.jpg) | English · LTR | Mobile 390 | `MobLogin` | english |
| S04 | [`Main`](screens/Main.jpg) | غرفة الأخبار · تفاعلي بالكامل | Desktop 1440 | `Main` | default |
| S04 | [`Main-loading`](screens/Main-loading.jpg) | تحميل العناوين | Desktop 1440 | `Main` | loading |
| S04 | [`Main-empty`](screens/Main-empty.jpg) | لا عناوين بهذا الفلتر | Desktop 1440 | `Main` | empty |
| S04 | [`Main-error`](screens/Main-error.jpg) | تعذّر جلب العناوين | Desktop 1440 | `Main` | error |
| S04 | [`Main-filters`](screens/Main-filters.jpg) | التصفية مفتوحة | Desktop 1440 | `Main` | filters |
| S04 | [`MobWire`](screens/MobWire.jpg) | العناوين | Mobile 390 | `MobWire` | default |
| S04 | [`MobWire-loading`](screens/MobWire-loading.jpg) | تحميل | Mobile 390 | `MobWire` | loading |
| S04 | [`MobWire-refresh`](screens/MobWire-refresh.jpg) | سحب للتحديث | Mobile 390 | `MobWire` | refresh |
| S04 | [`MobWire-swipe`](screens/MobWire-swipe.jpg) | سحب الخبر لأكشن سريع | Mobile 390 | `MobWire` | swipe |
| S04 | [`MobWire-empty`](screens/MobWire-empty.jpg) | لا عناوين بهذا الفلتر | Mobile 390 | `MobWire` | empty |
| S04 | [`MobWire-error`](screens/MobWire-error.jpg) | تعذّر الجلب | Mobile 390 | `MobWire` | error |
| S04 | [`MobFilters`](screens/MobFilters.jpg) | شيت التصفية | Mobile 390 | `MobFilters` | default |
| S04 | [`MobWire-dark`](screens/MobWire-dark.jpg) | العناوين | Mobile 390 | `MobWire` | ready · dark |
| S05 | [`Main-generating`](screens/Main-generating.jpg) | المحرّر يكتب | Desktop 1440 | `Main` | generating |
| S05 | [`MobStory`](screens/MobStory.jpg) | الخبر + الصيغة | Mobile 390 | `MobStory` | default |
| S05 | [`MobStory-carousel`](screens/MobStory-carousel.jpg) | إعدادات الكاروسيل | Mobile 390 | `MobStory` | carousel |
| S05 | [`MobGenerating`](screens/MobGenerating.jpg) | المحرّر يكتب | Mobile 390 | `MobGenerating` | default |
| S06 | [`Main-social`](screens/Main-social.jpg) | منشور سوشيال + المحرّر | Desktop 1440 | `Main` | social |
| S06 | [`DeskDraft`](screens/DeskDraft.jpg) | سكريبت فيديو + ذاكرة الفريق | Desktop 1440 | `DeskDraft` | default |
| S06 | [`DeskCarousel`](screens/DeskCarousel.jpg) | كاروسيل: الصور تُرسم | Desktop 1440 | `DeskCarousel` | default |
| S06 | [`Main-briefing`](screens/Main-briefing.jpg) | موجز الساعة | Desktop 1440 | `Main` | briefing |
| S06 | [`DeskArchive`](screens/DeskArchive.jpg) | الأرشيف وذاكرة الفريق | Desktop 1440 | `DeskArchive` | default |
| S06 | [`Main-desk`](screens/Main-desk.jpg) | خبر مكتبي | Desktop 1440 | `Main` | desk |
| S06 | [`Main-bulletin`](screens/Main-bulletin.jpg) | نشرة | Desktop 1440 | `Main` | bulletin |
| S06 | [`Main-facts`](screens/Main-facts.jpg) | ملف حقائق | Desktop 1440 | `Main` | facts |
| S06 | [`Main-context`](screens/Main-context.jpg) | سياق الخبر | Desktop 1440 | `Main` | context |
| S06 | [`MobDraft`](screens/MobDraft.jpg) | منشور سوشيال | Mobile 390 | `MobDraft` | default |
| S06 | [`MobDraft-video`](screens/MobDraft-video.jpg) | سكريبت فيديو | Mobile 390 | `MobDraft` | video |
| S06 | [`MobDraft-carousel`](screens/MobDraft-carousel.jpg) | كاروسيل · الصور تُرسم | Mobile 390 | `MobDraft` | carousel |
| S06 | [`MobDraft-briefing`](screens/MobDraft-briefing.jpg) | موجز الساعة | Mobile 390 | `MobDraft` | briefing |
| S06 | [`MobDraft-desk`](screens/MobDraft-desk.jpg) | خبر مكتبي | Mobile 390 | `MobDraft` | desk |
| S06 | [`MobDraft-facts`](screens/MobDraft-facts.jpg) | ملف حقائق | Mobile 390 | `MobDraft` | facts |
| S06 | [`MobDraft-revising`](screens/MobDraft-revising.jpg) | المحرّر يعدّل | Mobile 390 | `MobDraft` | revising |
| S06 | [`MobDraft-memory`](screens/MobDraft-memory.jpg) | قاعدة جديدة لذاكرة الفريق | Mobile 390 | `MobDraft` | memory |
| S06 | [`MobDraft-error`](screens/MobDraft-error.jpg) | فشل المحرّر | Mobile 390 | `MobDraft` | error |
| S06 | [`MobArchive`](screens/MobArchive.jpg) | الأرشيف · المسودات | Mobile 390 | `MobArchive` | default |
| S06 | [`MobArchive-memory`](screens/MobArchive-memory.jpg) | الأرشيف · ذاكرة الفريق | Mobile 390 | `MobArchive` | memory |
| S07 | [`DeskHome`](screens/DeskHome.jpg) | مكتب اليوم | Desktop 1440 | `DeskHome` | default |
| S07 | [`DeskHome-loading`](screens/DeskHome-loading.jpg) | تحميل | Desktop 1440 | `DeskHome` | loading |
| S07 | [`DeskHome-offline`](screens/DeskHome-offline.jpg) | بدون إنترنت | Desktop 1440 | `DeskHome` | offline |
| S07 | [`MobHome`](screens/MobHome.jpg) | الرئيسية | Mobile 390 | `MobHome` | default |
| S07 | [`MobHome-loading`](screens/MobHome-loading.jpg) | تحميل | Mobile 390 | `MobHome` | loading |
| S07 | [`MobHome-offline`](screens/MobHome-offline.jpg) | بدون إنترنت | Mobile 390 | `MobHome` | offline |
| S07 | [`DeskHome-dark`](screens/DeskHome-dark.jpg) | الرئيسية | Desktop 1440 | `DeskHome` | ready · dark |
| S07 | [`MobHome-dark`](screens/MobHome-dark.jpg) | الرئيسية | Mobile 390 | `MobHome` | ready · dark |
| S08 | [`DeskGenerate`](screens/DeskGenerate.jpg) | توليد · تفاعلي | Desktop 1440 | `DeskGenerate` | default |
| S08 | [`DeskGenerate-writing`](screens/DeskGenerate-writing.jpg) | يكتب | Desktop 1440 | `DeskGenerate` | writing |
| S08 | [`DeskGenerate-done`](screens/DeskGenerate-done.jpg) | جاهز | Desktop 1440 | `DeskGenerate` | done |
| S08 | [`DeskGenerate-error`](screens/DeskGenerate-error.jpg) | رابط مرفوض | Desktop 1440 | `DeskGenerate` | error |
| S08 | [`DeskGenerate-drafts`](screens/DeskGenerate-drafts.jpg) | مسوداتي | Desktop 1440 | `DeskGenerate` | drafts |
| S08 | [`DeskTranslate`](screens/DeskTranslate.jpg) | ترجمة · تفاعلي | Desktop 1440 | `DeskTranslate` | default |
| S08 | [`DeskTranslate-busy`](screens/DeskTranslate-busy.jpg) | يترجم | Desktop 1440 | `DeskTranslate` | busy |
| S08 | [`DeskTranslate-done`](screens/DeskTranslate-done.jpg) | جاهزة | Desktop 1440 | `DeskTranslate` | done |
| S08 | [`DeskTranslate-stale`](screens/DeskTranslate-stale.jpg) | الأصل اتعدّل | Desktop 1440 | `DeskTranslate` | stale |
| S08 | [`MobGenerate`](screens/MobGenerate.jpg) | توليد · فاضي | Mobile 390 | `MobGenerate` | default |
| S08 | [`MobGenerate-writing`](screens/MobGenerate-writing.jpg) | يكتب | Mobile 390 | `MobGenerate` | writing |
| S08 | [`MobGenerate-done`](screens/MobGenerate-done.jpg) | جاهز | Mobile 390 | `MobGenerate` | done |
| S08 | [`MobGenerate-error`](screens/MobGenerate-error.jpg) | رابط مرفوض | Mobile 390 | `MobGenerate` | error |
| S08 | [`MobGenerate-drafts`](screens/MobGenerate-drafts.jpg) | مسوداتي | Mobile 390 | `MobGenerate` | drafts |
| S08 | [`MobTranslate`](screens/MobTranslate.jpg) | ترجمة · فاضي | Mobile 390 | `MobTranslate` | default |
| S08 | [`MobTranslate-busy`](screens/MobTranslate-busy.jpg) | يترجم | Mobile 390 | `MobTranslate` | busy |
| S08 | [`MobTranslate-done`](screens/MobTranslate-done.jpg) | جاهزة | Mobile 390 | `MobTranslate` | done |
| S08 | [`MobTranslate-stale`](screens/MobTranslate-stale.jpg) | الأصل اتعدّل | Mobile 390 | `MobTranslate` | stale |
| S08 | [`DeskGenerate-dark`](screens/DeskGenerate-dark.jpg) | التوليد | Desktop 1440 | `DeskGenerate` | done · dark |
| S09 | [`DeskNotifications-off`](screens/DeskNotifications-off.jpg) | أول مرة · مش مفعّلة | Desktop 1440 | `DeskNotifications` | off |
| S09 | [`DeskNotifications`](screens/DeskNotifications.jpg) | مفعّلة | Desktop 1440 | `DeskNotifications` | default |
| S09 | [`DeskUsage`](screens/DeskUsage.jpg) | جاهز | Desktop 1440 | `DeskUsage` | default |
| S09 | [`DeskUsage-loading`](screens/DeskUsage-loading.jpg) | تحميل | Desktop 1440 | `DeskUsage` | loading |
| S09 | [`DeskUsage-error`](screens/DeskUsage-error.jpg) | تعذّر الاتصال | Desktop 1440 | `DeskUsage` | error |
| S09 | [`DeskUsage-custom`](screens/DeskUsage-custom.jpg) | فترة مخصّصة + خطأ تاريخ | Desktop 1440 | `DeskUsage` | custom |
| S09 | [`DeskUsage-setup`](screens/DeskUsage-setup.jpg) | الحساب غير مربوط | Desktop 1440 | `DeskUsage` | not-configured |
| S09 | [`DeskUsage-forbidden`](screens/DeskUsage-forbidden.jpg) | للأدمن فقط | Desktop 1440 | `DeskUsage` | forbidden |
| S09 | [`MobNotif-off`](screens/MobNotif-off.jpg) | الإشعارات · أول مرة | Mobile 390 | `MobNotif` | off |
| S09 | [`MobNotif`](screens/MobNotif.jpg) | الإشعارات · مفعّلة | Mobile 390 | `MobNotif` | default |
| S09 | [`MobNotif-blocked`](screens/MobNotif-blocked.jpg) | الإشعارات · محظورة | Mobile 390 | `MobNotif` | blocked |
| S09 | [`MobUsage`](screens/MobUsage.jpg) | استهلاك AI | Mobile 390 | `MobUsage` | default |
| S09 | [`MobUsage-loading`](screens/MobUsage-loading.jpg) | استهلاك · تحميل | Mobile 390 | `MobUsage` | loading |
| S10 | [`States`](screens/States.jpg) | كل الحالات | Desktop 1440 | `States` | default |
| S10 | [`MobSystem`](screens/MobSystem.jpg) | بدون إنترنت | Mobile 390 | `MobSystem` | default |
| S10 | [`MobSystem-quota`](screens/MobSystem-quota.jpg) | رصيد OpenAI خلص | Mobile 390 | `MobSystem` | quota |
| S10 | [`MobSystem-ratelimit`](screens/MobSystem-ratelimit.jpg) | حد الطلبات | Mobile 390 | `MobSystem` | ratelimit |
| S10 | [`MobSystem-session`](screens/MobSystem-session.jpg) | الجلسة انتهت | Mobile 390 | `MobSystem` | session |
| S10 | [`MobSystem-install`](screens/MobSystem-install.jpg) | ثبّت التطبيق | Mobile 390 | `MobSystem` | install |
| S10 | [`MobSystem-update`](screens/MobSystem-update.jpg) | إصدار جديد | Mobile 390 | `MobSystem` | update |
| S10 | [`MobSystem-logout`](screens/MobSystem-logout.jpg) | تأكيد الخروج | Mobile 390 | `MobSystem` | logout |
| S10 | [`Main-dark`](screens/Main-dark.jpg) | غرفة الأخبار | Desktop 1440 | `Main` | social · dark |
| S10 | [`DeskCarousel-dark`](screens/DeskCarousel-dark.jpg) | الكاروسيل | Desktop 1440 | `DeskCarousel` | ready · dark |
| S10 | [`MobGenerating-dark`](screens/MobGenerating-dark.jpg) | المحرّر يكتب | Mobile 390 | `MobGenerating` | ready · dark |
| S10 | [`MobDraft-dark`](screens/MobDraft-dark.jpg) | المسودة + ذاكرة الفريق | Mobile 390 | `MobDraft` | memory · dark |
| S11 | [`NewCmdK`](screens/NewCmdK.jpg) | لوحة الأوامر Ctrl+K | Desktop 1440 | `NewCmdK` | default |
| S11 | [`NewShortcuts`](screens/NewShortcuts.jpg) | اختصارات الكيبورد | Desktop 1440 | `NewShortcuts` | default |
| S12 | [`NewPublish`](screens/NewPublish.jpg) | جاهز للنشر: معاينة المنصات + فحص قبل النشر · تفاعلي | Desktop 1440 | `NewPublish` | default |
| S12 | [`MobNewPreview`](screens/MobNewPreview.jpg) | معاينة النشر | Mobile 390 | `MobNewPreview` | default |
| S12 | [`MobNewCheck`](screens/MobNewCheck.jpg) | فحص قبل النشر | Mobile 390 | `MobNewCheck` | default |
| S13 | [`NewBreaking`](screens/NewBreaking.jpg) | وضع العاجل | Desktop 1440 | `NewBreaking` | default |
| S13 | [`NewDigest`](screens/NewDigest.jpg) | اللي فاتك + الموضوعات الصاعدة | Desktop 1440 | `NewDigest` | default |
| S13 | [`MobNewBreaking`](screens/MobNewBreaking.jpg) | وضع العاجل | Mobile 390 | `MobNewBreaking` | default |
| S13 | [`MobNewDigest`](screens/MobNewDigest.jpg) | اللي فاتك | Mobile 390 | `MobNewDigest` | default |
| S14 | [`NewTimeline`](screens/NewTimeline.jpg) | تطور القصة + تعارض المصادر | Desktop 1440 | `NewTimeline` | default |
| S14 | [`NewDiff`](screens/NewDiff.jpg) | قارن النسخ | Desktop 1440 | `NewDiff` | default |
| S14 | [`MobNewTimeline`](screens/MobNewTimeline.jpg) | تطور القصة | Mobile 390 | `MobNewTimeline` | default |
| S14 | [`MobNewDiff`](screens/MobNewDiff.jpg) | قارن النسخ | Mobile 390 | `MobNewDiff` | default |
| S15 | [`NewBoard`](screens/NewBoard.jpg) | سير العمل والفريق | Desktop 1440 | `NewBoard` | default |
| S15 | [`MobNewQueue`](screens/MobNewQueue.jpg) | سير العمل | Mobile 390 | `MobNewQueue` | default |
| S16 | [`NewOnboarding`](screens/NewOnboarding.jpg) | أول تشغيل · علّم المحرّر أسلوبك | Desktop 1440 | `NewOnboarding` | default |
| S16 | [`MobNewVoice`](screens/MobNewVoice.jpg) | إملاء صوتي | Mobile 390 | `MobNewVoice` | default |
| S16 | [`MobOnboard`](screens/MobOnboard.jpg) | ١ · بتنشر فين؟ | Mobile 390 | `MobOnboard` | default |
| S16 | [`MobOnboard-two`](screens/MobOnboard-two.jpg) | ٢ · بتتابع مين؟ | Mobile 390 | `MobOnboard` | two |
| S16 | [`MobOnboard-three`](screens/MobOnboard-three.jpg) | ٣ · علّم المحرّر أسلوبك | Mobile 390 | `MobOnboard` | three |
| — | [`Cover`](screens/Cover.jpg) | الفهرس | Desktop 1440 | `Cover` | default |
