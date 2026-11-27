import { CATEGORIES, PAGE_GUIDES, PageGuide, getGuideByPath } from "./guideData";

export type GuideLocale = "id" | "en" | "ar";

interface GuideTranslation {
  title: string;
  subtitle: string;
  categoryLabel: string;
  badge?: string;
  summary: string;
  howToUse: string[];
  controls: { name: string; desc: string }[];
  tips: string[];
  faq?: { q: string; a: string }[];
}

const CATEGORY_LABELS: Record<"en" | "ar", Record<string, string>> = {
  en: {
    semua: "All Features",
    utama: "Main Menu",
    komunikasi: "Communication",
    sosial: "Social & Worship",
    eksklusif: "Satellite Apps",
    admin: "Admin Portal",
  },
  ar: {
    semua: "جميع الميزات",
    utama: "القائمة الرئيسية",
    komunikasi: "التواصل",
    sosial: "الاجتماعي والعبادة",
    eksklusif: "الميزات الحصرية",
    admin: "إدارة المشرفين",
  },
};

const GUIDE_TRANSLATIONS: Record<"en" | "ar", Record<string, GuideTranslation>> = {
  en: {
    beranda: {
      title: "Cohort Home & Timeline",
      subtitle: "Digital Museum & 43rd Cohort Footsteps",
      categoryLabel: "Main Menu",
      summary:
        "The main portal gateway showcasing cohort philosophy, leadership advice, the interactive 3D emblem, historical milestones, and direct access to every alumni service.",
      howToUse: [
        "Scroll from top to bottom to follow the cohort story, 3D crest, and historical timeline.",
        "Use the left navigation sidebar (or menu button on mobile) to open other features.",
        "Write greetings in the quick guestbook section so classmates can read your updates.",
      ],
      controls: [
        { name: "3D Emblem Stage", desc: "Click and drag to inspect the cohort emblem in 3D from any angle." },
        { name: "History Timeline", desc: "Key chronological milestones and gatherings of the 43rd cohort." },
        { name: "Quick Guestbook", desc: "Leave a short greeting and prayer that appears directly on the home board." },
      ],
      tips: [
        "Set your Light or Dark theme and preferred language using the top-corner controls.",
        "Press Ctrl + K (or Cmd + K on Mac) anytime to jump to any page.",
      ],
    },
    direktori: {
      title: "Alumni Directory",
      subtitle: "Verified Contact List & Classmate Database",
      categoryLabel: "Main Menu",
      summary:
        "Searchable cohort database with verified classmate profiles, current city, WhatsApp contact buttons, and downloadable contact cards.",
      howToUse: [
        "Type a classmate's full name, nickname, dormitory region, or current city in the search box.",
        "Use the filter dropdowns to narrow results by Putra/Putri wing or class section.",
        "Open any alumnus card to start a WhatsApp chat or save a `.vcf` contact card.",
      ],
      controls: [
        { name: "Search Input", desc: "Instant filter by full name, nickname, class section, or current city." },
        { name: "Wing & Class Filters", desc: "Narrow the list by Putra/Putri wing and final class section." },
        { name: "WhatsApp Button", desc: "Opens WhatsApp directly to your classmate's registered phone number." },
        { name: "Save Contact (vCard)", desc: "Downloads a `.vcf` contact file straight into your phone address book." },
      ],
      tips: [
        "Keep your own city and phone number updated in Profile so classmates can reach you when visiting your area.",
      ],
    },
    galeri: {
      title: "Memory Gallery",
      subtitle: "Photo & Video Archives from Pondok Modern Arrisalah",
      categoryLabel: "Main Menu",
      summary:
        "Curated visual archive holding campus documentation, graduation moments, reunion snapshots, and nostalgia albums contributed by classmates.",
      howToUse: [
        "Filter albums using the Putra, Putri, or General event tabs.",
        "Click any photo or video thumbnail to open the high-resolution lightbox viewer.",
        "Share your own vintage photos through the upload form to preserve shared memories.",
      ],
      controls: [
        { name: "Album Tabs", desc: "Filter archive media by Putra wing, Putri wing, or shared events." },
        { name: "Ambient Audio Toggle", desc: "Play or pause background instrumental nostalgia audio while browsing." },
        { name: "Upload Media", desc: "Contribute verified photos from personal storage to the cohort archive." },
        { name: "Download Photo", desc: "Save high-resolution archive images directly to your device." },
      ],
      tips: [
        "Add accurate year and event captions before uploading so younger and older sections recognize the moment.",
      ],
    },
    radar: {
      title: "Alumni Geographic Radar",
      subtitle: "Interactive Distribution Map & 3D Globe",
      categoryLabel: "Main Menu",
      summary:
        "Live interactive world map and 3D globe displaying where 43rd cohort alumni currently reside across cities and countries.",
      howToUse: [
        "Switch between the 2D street map and the 3D globe view at the top bar.",
        "Check the Top Cities breakdown to spot major alumni hubs.",
        "Click any map pin to view the alumnus summary and open their profile.",
      ],
      controls: [
        { name: "Map / Globe Toggle", desc: "Switch between detailed 2D street mapping and the 3D globe overview." },
        { name: "Top Cities Summary", desc: "Highlights the cities with the highest concentration of cohort alumni." },
        { name: "Update GPS Location", desc: "Syncs your approximate city coordinates with your profile record." },
        { name: "Pin Summary Drawer", desc: "Displays the alumnus city, profession, and link to their full dossier." },
      ],
      tips: [
        "Enable GPS sync once whenever you relocate for study or work so classmates nearby can connect.",
      ],
    },
    syndicate: {
      title: "Alumni Business Directory",
      subtitle: "Stores, Ventures & Professional Services",
      categoryLabel: "Main Menu",
      summary:
        "Central showcase supporting cohort entrepreneurship, culinary stalls, creative agencies, and consulting services operated by fellow alumni.",
      howToUse: [
        "Filter listings by business category or search product keywords.",
        "Open any store card to read details and contact the owner directly via WhatsApp.",
        "Submit your own enterprise using the Register Business form.",
      ],
      controls: [
        { name: "Register Business", desc: "Submit your store name, category, catalog details, and WhatsApp contact." },
        { name: "Category Filters", desc: "Browse businesses grouped by industry and service type." },
        { name: "Order via WhatsApp", desc: "Start a WhatsApp inquiry directly with the alumni business owner." },
      ],
      tips: [
        "Share your store slug link externally so customers can browse your public catalog directly.",
      ],
    },
    fitur: {
      title: "Services & App Directory",
      subtitle: "Gateway to All Portal Features",
      categoryLabel: "Main Menu",
      summary:
        "Categorized directory of worship tools, social rooms, archive galleries, and interactive utilities available across Expedient 43.",
      howToUse: [
        "Browse sections organized by Worship, Social & Community, and Special Utilities.",
        "Select any launcher card to navigate straight to that tool.",
      ],
      controls: [
        { name: "Service Cards", desc: "Open the selected worship, social, or creative utility page." },
      ],
      tips: [
        "Add frequent worship pages like Al-Qur'an or Al-Ma'tsurat to your mobile home screen for quick daily access.",
      ],
    },
    profil: {
      title: "Personal Profile & Account",
      subtitle: "Biodata, Portrait Cropper & Preferences",
      categoryLabel: "Main Menu",
      summary:
        "Manage your directory card, square portrait cropper, residential city, password security, language selector, and 3D membership card shortcut.",
      howToUse: [
        "Update personal details across the Identity, Contact, and Social steps, then save.",
        "Upload a portrait image and adjust the 1:1 crop frame before applying.",
        "Switch interface language (Indonesian, Arabic, English) or change your password when needed.",
      ],
      controls: [
        { name: "Portrait Cropper", desc: "1:1 square image cropper for your official alumni avatar." },
        { name: "Save Profile", desc: "Commits updated contact, city, and career biodata to the directory." },
        { name: "Security & Language", desc: "Update account password, notification toggles, and UI language." },
        { name: "3D Alumni Card", desc: "Opens your interactive Sovereign ID card for sharing or saving." },
      ],
      tips: [
        "Complete all three steps so your profile counts as verified across search and matching features.",
      ],
    },
    "chat-lounge": {
      title: "Cohort Lounge Chat",
      subtitle: "Shared Conversation Room for All Alumni",
      categoryLabel: "Communication",
      summary:
        "Real-time cohort messaging room supporting text, voice notes, images, and quick reactions across classmates.",
      howToUse: [
        "Type a message in the composer bar and press Enter or Send to post.",
        "Hold or tap the microphone button to attach a quick voice message.",
        "Open any message options menu if you need to remove your own message.",
      ],
      controls: [
        { name: "Voice Recorder", desc: "Record and send an audio message directly inside the lounge." },
        { name: "Video Clip", desc: "Share short video clips with classmates." },
        { name: "Image Upload", desc: "Attach and share photographs directly in conversation." },
        { name: "Emoji Bar", desc: "Insert expressions into your chat message." },
      ],
      tips: [
        "Keep discussions courteous and welcoming for both Putra and Putri alumni wings.",
      ],
    },
    "chat-personal": {
      title: "Direct Messages & Calls",
      subtitle: "Private One-to-One Chat & WebRTC Audio/Video",
      categoryLabel: "Communication",
      summary:
        "Private direct messaging thread with end-to-peer WebRTC voice and video call controls for reconnecting closely with individual classmates.",
      howToUse: [
        "Select a classmate from the contact list on the left to open your thread.",
        "Use the phone or camera icon in the header bar to start a WebRTC voice or video call.",
      ],
      controls: [
        { name: "Voice Call", desc: "Start a live browser-to-browser audio call over WebRTC." },
        { name: "Video Call", desc: "Initiate a face-to-face video call inside the portal." },
        { name: "Delete Message", desc: "Remove your own sent message if needed." },
      ],
      tips: [
        "Grant browser microphone and camera permission when prompted before starting a call.",
      ],
    },
    birthday: {
      title: "Milad Reminders & Prayers",
      subtitle: "Cohort Birthday Calendar & Wishes",
      categoryLabel: "Communication",
      summary:
        "Track classmates celebrating birthdays today and this month, and send heartfelt prayers for blessings in health and life.",
      howToUse: [
        "Check today's spotlight or browse upcoming monthly birthdays.",
        "Click the send prayer button on any classmate's card to share a milestone blessing.",
      ],
      controls: [
        { name: "Today's Milad List", desc: "Displays classmates marking their birthday today." },
        { name: "Send Prayer Greeting", desc: "Posts a personal milad prayer and greeting card." },
      ],
      tips: [
        "Make sure your birth date is accurate in your Profile so your classmates remember your day.",
      ],
    },
    "buku-tamu": {
      title: "Digital Guestbook",
      subtitle: "Public Salutations, Notes & Cohort Prayers",
      categoryLabel: "Communication",
      summary:
        "Shared guestbook wall where alumni post memories, open invitations, and prayers for the cohort and Pondok Modern Arrisalah.",
      howToUse: [
        "Fill in your sender name (or stay signed in) and type your message.",
        "Sort entries to browse recent salutations or pinned alumni wishes.",
      ],
      controls: [
        { name: "Guestbook Composer", desc: "Form to write greetings, memories, and cohort prayers." },
        { name: "Sort Controls", desc: "Reorder notes by newest posts or category." },
      ],
      tips: [
        "Mention your current city in greetings so traveling classmates know where to meet up.",
      ],
    },
    event: {
      title: "Agendas & Reunions",
      subtitle: "Gatherings, Iftar Schedules & Silaturahmi",
      categoryLabel: "Communication",
      summary:
        "Official calendar of regional meetups, national cohort reunions, and online gatherings with attendee RSVP counts and venue maps.",
      howToUse: [
        "Check countdown timers and venue addresses on upcoming event cards.",
        "Click Attending (RSVP) so organizers can plan seating and hospitality.",
        "Open the linked map location on event day for turn-by-turn directions.",
      ],
      controls: [
        { name: "RSVP Attendance", desc: "Confirm your attendance so reunion committees can tally headcount." },
        { name: "Open Map Directions", desc: "Launch Google Maps directly to the reunion venue." },
        { name: "Event Countdown", desc: "Remaining days and hours before the gathering starts." },
      ],
      tips: [
        "Cancel or update your RSVP early if plans change to help committee logistics.",
      ],
    },
    "baitul-maal": {
      title: "Cohort Treasury (Baitul Maal)",
      subtitle: "Transparent Social Fund & Solidarity Donations",
      categoryLabel: "Social & Worship",
      summary:
        "Transparent cohort ledger recording member contributions, bereavement aid, social assistance disbursements, and downloadable donation receipts.",
      howToUse: [
        "Review live incoming and outgoing cash totals and category breakdowns.",
        "Copy the official treasurer transfer account number when sending infaq or dues.",
        "Submit transfer confirmation details so treasurers can log and verify your donation.",
      ],
      controls: [
        { name: "Copy Account Number", desc: "Copy official treasury bank or e-wallet number to clipboard." },
        { name: "Confirm Transfer", desc: "Record transfer date, amount, and purpose for verification." },
        { name: "Ledger Breakdown", desc: "Visual summary comparing inflow and social program allocations." },
      ],
      tips: [
        "Print or save your verified donation receipt directly from your transaction row.",
      ],
    },
    multazam: {
      title: "Multazam Prayer Wall",
      subtitle: "Mutual Supplications & Shared Ameen Counter",
      categoryLabel: "Social & Worship",
      summary:
        "Quiet community wall to entrust personal supplications—health, parents' wellbeing, studies, marriage, and livelihood—so classmates can pray alongside you.",
      howToUse: [
        "Read prayers posted by classmates and press Ameen to join their supplication.",
        "Post your own prayer request openly or anonymously using the composer form.",
      ],
      controls: [
        { name: "Ameen Button", desc: "Adds your shared supplication count to a classmate's prayer." },
        { name: "Post Prayer", desc: "Publish a personal prayer request to the cohort wall." },
        { name: "Topic Filter", desc: "Filter prayer cards by theme or category." },
      ],
      tips: [
        "Check in on Friday nights or after Fajr to say Ameen for classmates facing trials.",
      ],
    },
    majlis: {
      title: "Majlis & Study Room",
      subtitle: "Alumni Study Sessions & Audio Tausiyah",
      categoryLabel: "Social & Worship",
      summary:
        "Community learning space offering study session announcements, tausiyah recordings, and Q&A topics led by alumni ustadz.",
      howToUse: [
        "Browse scheduled online or regional study sessions.",
        "Play archived audio lectures or submit questions for upcoming discussions.",
      ],
      controls: [
        { name: "Audio Player", desc: "Listen to archived alumni tausiyah recordings inside your browser." },
        { name: "Submit Question", desc: "Send topic requests or questions ahead of the next study session." },
        { name: "Recording Archive", desc: "Browse earlier study sessions ready for playback anytime." },
      ],
      tips: [
        "Bookmark recordings to revisit over long commutes.",
      ],
    },
    tarbiyah: {
      title: "Career & Mentorship Network",
      subtitle: "Professional Guidance & Job Opportunities",
      categoryLabel: "Social & Worship",
      summary:
        "Alumni mentorship directory connecting younger or pivoting graduates with experienced seniors across medicine, engineering, education, and business.",
      howToUse: [
        "Search mentors by specialty or browse verified alumni job postings.",
        "Reach out directly through provided contact links or consultation prompts.",
      ],
      controls: [
        { name: "Request Mentorship", desc: "Send a career consultation inquiry or topic prompt." },
        { name: "Job Listings", desc: "View career openings shared and vetted by cohort members." },
      ],
      tips: [
        "Offer your field in your profile if you are open to mentoring fresh graduates.",
      ],
    },
    wasiat: {
      title: "Future Capsule Letters (Wasiat)",
      subtitle: "Time-Locked Notes & Fraternal Advice",
      categoryLabel: "Social & Worship",
      summary:
        "A dedicated digital time-capsule vault for sealing advice, gratitude, and cohort letters programmed to unlock on future milestone dates.",
      howToUse: [
        "Write a reflection note and pick a target unlock date or milestone year.",
        "View locked capsule countdowns or open capsules whose unlock date has arrived.",
      ],
      controls: [
        { name: "Seal Capsule", desc: "Locks your note with a scheduled future unlock date." },
        { name: "Unlock Status", desc: "Shows remaining time until sealed letters open." },
      ],
      tips: [
        "Write a short prayer for the 5-year or 10-year grand reunion milestone.",
      ],
    },
    kontemplasi: {
      title: "Contemplation & Dhikr Room",
      subtitle: "Quiet Murottal & Ambient Audio Space",
      categoryLabel: "Social & Worship",
      summary:
        "Distraction-free reflection room pairing curated Qur'an recitations with gentle ambient soundscapes and calm full-screen pacing.",
      howToUse: [
        "Choose a Surah recitation and optional rain/wind ambient layer.",
        "Enter calm full-screen view while resting or winding down before Fajr.",
      ],
      controls: [
        { name: "Recitation Player", desc: "Play, pause, and switch selected qari tilawah audio." },
        { name: "Distraction-Free Mode", desc: "Hides surrounding panels for calm reflection." },
        { name: "Ambient Layer", desc: "Mix optional gentle rain or water soundscapes." },
      ],
      tips: [
        "Headphones offer the clearest balance between qari recitation and gentle ambient sound.",
      ],
    },
    sovereign: {
      title: "3D Digital Alumni Card",
      subtitle: "Official Interactive Expedient 43 ID Card",
      categoryLabel: "Satellite Apps",
      badge: "3D Interactive",
      summary:
        "Your personal verified digital alumni card rendered in interactive 3D gold or ivory finishes with an authentic verification QR code.",
      howToUse: [
        "Drag or tilt the card canvas to view light reflections across front and back.",
        "Switch between Dark Obsidian Gold and Pearl Ivory editions.",
        "Save high-resolution PNG card images to share or print.",
      ],
      controls: [
        { name: "360° Rotation", desc: "Rotate and inspect both sides of your alumni card." },
        { name: "Card Edition Switch", desc: "Toggle between Dark Gold and Pearl Light card themes." },
        { name: "Export PNG", desc: "Downloads a crisp printable copy of your card." },
        { name: "Verification QR", desc: "Scannable QR linking straight to your verified alumni dossier." },
      ],
      tips: [
        "Upload a clear square portrait in Profile before exporting your card.",
      ],
    },
    photobooth: {
      title: "Virtual Photobooth Studio",
      subtitle: "4-Pose Reunion Photostrip Creator",
      categoryLabel: "Satellite Apps",
      badge: "Interactive Camera",
      summary:
        "Snap or upload four poses and compose a customized cohort photostrip with color frames, text captions, and playful stickers ready to save.",
      howToUse: [
        "Choose 4-pose camera capture with timer or upload 4 gallery photos directly.",
        "Pick frame colors, background palettes, and optional custom labels.",
        "Download the final photostrip image to your device.",
      ],
      controls: [
        { name: "Shutter & Timer", desc: "Captures a timed sequence of 4 alternating poses." },
        { name: "Switch Lens / Mirror", desc: "Toggle front/rear camera or mirror preview." },
        { name: "Frame Themes", desc: "Customize border tones, gold accents, and strip caption text." },
        { name: "Download Strip", desc: "Renders and downloads your finished high-resolution PNG strip." },
      ],
      tips: [
        "Gather friends at regional reunions to take a group 4-pose strip together.",
      ],
    },
    scanner: {
      title: "QR Contact Scanner",
      subtitle: "Instant KTA & Profile Verification Reader",
      categoryLabel: "Satellite Apps",
      summary:
        "Live camera QR scanner built for meetups to read classmate 3D KTA QR codes and open their verified alumni dossier in one scan.",
      howToUse: [
        "Allow camera permission and aim the frame over a classmate's KTA QR code.",
        "Open the recognized profile dossier immediately once detected.",
      ],
      controls: [
        { name: "Scanner Viewport", desc: "Reads verified alumni QR codes in real time." },
        { name: "Camera Switch", desc: "Switch between front and rear cameras on mobile." },
      ],
      tips: [
        "Ensure steady lighting so the QR code contrasts sharply against the card surface.",
      ],
    },
    wrapped: {
      title: "Cohort Wrapped Recap",
      subtitle: "Milestone Statistics & Journey Stories",
      categoryLabel: "Satellite Apps",
      badge: "Story Recap",
      summary:
        "Multi-slide summary spotlighting active cohort figures, geography reach, shared photos, and memorable brotherhood statistics.",
      howToUse: [
        "Tap Next/Prev or slide edges to step through cohort recap cards.",
        "Use Share / Download Slide to keep a favorite milestone snapshot.",
      ],
      controls: [
        { name: "Slide Navigation", desc: "Tap screen edges or controls to advance through recap cards." },
        { name: "Share Recap", desc: "Export summary slides to share with reunion groups." },
      ],
      tips: [
        "Updated figures grow alongside alumni profile, photo, and khatam contributions.",
      ],
    },
    download: {
      title: "App Download & Install Guide",
      subtitle: "Android APK & iPhone Safari Web App Setup",
      categoryLabel: "Satellite Apps",
      summary:
        "Official guide to download the standalone Android APK release or add the full-screen portal shortcut directly onto iPhone and Android home screens.",
      howToUse: [
        "On Android: Download the official APK file from the gold button and confirm installation in settings.",
        "On iPhone: Open in Safari, tap Share (square with upward arrow), and select Add to Home Screen.",
        "Launch Expedient 43 right from your home screen icon with full-screen navigation.",
      ],
      controls: [
        { name: "Download Android (.APK)", desc: "Fetches the official Android release package." },
        { name: "Step-by-Step Tabs", desc: "Switch written instructions between Android APK, iPhone Safari, and PWA." },
      ],
      tips: [
        "Android warns once before installing APKs outside Play Store—enable browser permission for that file only.",
      ],
    },
    celestial: {
      title: "Words of Wisdom (Mutiara Hikmah)",
      subtitle: "Curated Advice from Kyai & Asatidz",
      categoryLabel: "Satellite Apps",
      summary:
        "Curated collection of timeless advice and moral reminders from Arrisalah leaders and teachers to keep close in daily life.",
      howToUse: [
        "Browse curated wisdom cards one at a time or filter by theme.",
        "Copy favorite quotes in one tap to share with family or cohort groups.",
      ],
      controls: [
        { name: "Copy Wisdom Quote", desc: "Copies formatted text cleanly to your clipboard." },
      ],
      tips: [
        "Keep a quiet daily reading habit of one teacher reflection before morning work.",
      ],
    },
    divine: {
      title: "Daily Ayah & Reflection",
      subtitle: "Selected Qur'anic Verses & Hadith",
      categoryLabel: "Satellite Apps",
      summary:
        "Rotating daily ayah and prophetic narration pairing Arabic script, clear translation, brief reflection context, and recitation audio.",
      howToUse: [
        "Read today's highlighted ayah or advance to explore additional curated verses.",
        "Press Listen to play clear recitation audio alongside the text.",
      ],
      controls: [
        { name: "Play Ayah Audio", desc: "Listen to qari recitation for the displayed verse." },
      ],
      tips: [
        "Check back regularly for fresh weekly reflections and memorized ayah reminders.",
      ],
    },
    genesis: {
      title: "Cohort Origins & Philosophy",
      subtitle: "Panca Jiwa & Emblem Symbolism",
      categoryLabel: "Satellite Apps",
      summary:
        "Explores why the 43rd cohort adopted the name Expedient Generation, the Blue Marble emblem's color symbolism, and Panca Jiwa values.",
      howToUse: [
        "Read through each pillar section—from Ponorogo roots to the 643 Panggung Gembira milestone.",
      ],
      controls: [
        { name: "Explore Philosophy", desc: "Inspect symbolism behind each visual element of the cohort emblem." },
      ],
      tips: [
        "Great starting page to introduce family members to Arrisalah Panca Jiwa values.",
      ],
    },
    nexus: {
      title: "Interest & City Matcher (Nexus)",
      subtitle: "Find Alumni with Shared Fields & Cities",
      categoryLabel: "Satellite Apps",
      summary:
        "Matches your biodata—current city, profession keywords, and listed hobbies—against fellow verified alumni so you discover nearby peers.",
      howToUse: [
        "Ensure your city, profession, and interests are filled out in your Profile.",
        "Run the scan button to compute similarity matches ranked from highest overlap.",
      ],
      controls: [
        { name: "Start Scan", desc: "Computes deterministic city and keyword overlap across verified profiles." },
      ],
      tips: [
        "More detailed bio keywords produce much stronger collaborator and city matches.",
      ],
    },
    enigma: {
      title: "Private Encrypted Journal (Enigma)",
      subtitle: "Local Personal Diary & Memories Vault",
      categoryLabel: "Satellite Apps",
      summary:
        "Personal private journal space for storing quiet reflections, study notes, and memories securely using passphrase protection.",
      howToUse: [
        "Unlock your journal vault with your personal passphrase or create new entries.",
        "Export or back up your written entries when switching devices.",
      ],
      controls: [
        { name: "Add Note", desc: "Create a new timestamped private journal entry." },
      ],
      tips: [
        "Remember your passphrase carefully—encrypted local entries cannot be recovered if forgotten.",
      ],
    },
    oracle: {
      title: "Positive Aura Camera (Oracle)",
      subtitle: "Interactive Camera Snapshot & Encouragement",
      categoryLabel: "Satellite Apps",
      summary:
        "Interactive camera utility that analyzes video frames from your device camera and pairs them with uplifting cohort reflections.",
      howToUse: [
        "Allow temporary camera permission when clicking Start.",
        "Capture a cheerful snapshot to receive a cohort message card.",
      ],
      controls: [
        { name: "Capture Moment", desc: "Reads a camera frame and displays a positive cohort note." },
      ],
      tips: [
        "Runs completely inside your browser camera stream with no photos uploaded unless you save them.",
      ],
    },
    "admin-users": {
      title: "Manage Users & Alumni",
      subtitle: "Accounts, Verification & Role Permissions",
      categoryLabel: "Admin Portal",
      badge: "Admin Only",
      summary:
        "Administration panel to verify incoming alumni registrations, adjust Putra/Putri metadata, assign moderator/admin roles, and manage access.",
      howToUse: [
        "Search or filter member accounts by role or verification status.",
        "Inspect account details before promoting roles or revoking access.",
      ],
      controls: [
        { name: "Update Role", desc: "Assign or revoke admin privileges for trusted cohort coordinators." },
        { name: "Remove Account", desc: "Confirmed removal workflow with explicit confirmation prompt." },
      ],
      tips: [
        "Double-check the classmate email and cohort section before granting admin privileges.",
      ],
    },
    "admin-cms": {
      title: "Content Manager (CMS)",
      subtitle: "Edit Portal Banners, Copy & Media",
      categoryLabel: "Admin Portal",
      badge: "Admin Only",
      summary:
        "Edit home announcements, event highlights, and stored images safely from the admin console without touching code.",
      howToUse: [
        "Pick the CMS tab matching the section you wish to edit.",
        "Update copy or upload optimized images, then save changes to Supabase.",
      ],
      controls: [
        { name: "Content Editor", desc: "Edit headlines and descriptions displayed across public sections." },
        { name: "Media Uploader", desc: "Compress and attach new banner images." },
        { name: "Save CMS", desc: "Publishes edits directly to the Supabase store." },
      ],
      tips: [
        "Preview changes in Light and Dark themes after saving home copy.",
      ],
    },
    "admin-broadcast": {
      title: "Mass Announcements & Broadcast",
      subtitle: "Push & Portal Notifications to Alumni",
      categoryLabel: "Admin Portal",
      badge: "Admin Only",
      summary:
        "Send urgent cohort news, reunion notices, or bereavement announcements across active push notification subscribers and inbox feeds.",
      howToUse: [
        "Compose a clear title and concise announcement message.",
        "Target all verified alumni or specific cities/wings, then dispatch.",
      ],
      controls: [
        { name: "Send Broadcast", desc: "Queues real-time push and in-app notifications." },
        { name: "Audience Filter", desc: "Scope recipients to a specific cohort group or city." },
      ],
      tips: [
        "Keep urgent push notification headlines under 60 characters so mobile notifications never truncate.",
      ],
    },
    "admin-moderation": {
      title: "Message Moderation",
      subtitle: "Keep Cohort Channels Respectful & Clean",
      categoryLabel: "Admin Portal",
      badge: "Admin Only",
      summary:
        "Review flagged lounge posts, guestbook entries, or spam items and remove inappropriate content with audit confirmation.",
      howToUse: [
        "Review recent posts and flagged items in the moderation queue.",
        "Use confirmed Delete actions to clean spam or rule violations.",
      ],
      controls: [
        { name: "Remove Entry", desc: "Confirmed removal of spam or off-topic posts from public rooms." },
      ],
      tips: [
        "Contact the poster privately when resolving misunderstandings among classmates.",
      ],
    },
    "admin-export": {
      title: "Database Export & Backups",
      subtitle: "Download Alumni Tables in CSV / JSON",
      categoryLabel: "Admin Portal",
      badge: "Admin Only",
      summary:
        "Export structured alumni contact sheets, event RSVPs, and financial logs for offline committee coordination.",
      howToUse: [
        "Pick the desired dataset and click Download CSV or JSON.",
      ],
      controls: [
        { name: "Download Export", desc: "Generates clean spreadsheet-compatible export files." },
      ],
      tips: [
        "Handle exported contact lists strictly for official cohort coordination—never share publicly.",
      ],
    },
    "admin-wallet": {
      title: "Batch KTA Card Generator",
      subtitle: "Generate Printable Alumni Cards in Bulk",
      categoryLabel: "Admin Portal",
      badge: "Admin Only",
      summary:
        "Render batches of standardized 43rd cohort member ID cards for reunion welcome kits or committee archives.",
      howToUse: [
        "Filter selected members and trigger batch rendering.",
        "Download finished card images or bundled archive.",
      ],
      controls: [
        { name: "Start Batch Render", desc: "Processes printable alumni cards sequentially." },
        { name: "Download Archive", desc: "Downloads all rendered cards together." },
      ],
      tips: [
        "Verify member portraits are crisp before printing physical reunion badges.",
      ],
    },
  },
  ar: {
    beranda: {
      title: "الرئيسية ومسيرة الدفعة",
      subtitle: "المتحف الرقمي والخط الزمني للدفعة ٤٣",
      categoryLabel: "القائمة الرئيسية",
      summary:
        "الواجهة الرئيسية للبوابة التي تعرض فلسفة الدفعة وتوجيهات المشايخ والشعار التفاعلي ثلاثي الأبعاد والخط الزمني التاريخي والوصول السريع لكل الخدمات.",
      howToUse: [
        "تصفح الأقسام من الأعلى إلى الأسفل لمتابعة قصة الدفعة والشعار ثلاثي الأبعاد والمعالم التاريخية.",
        "استخدم القائمة الجانبية لفتح باقي صفحات البوابة وخدماتها.",
        "اكتب تحية قصيرة في سجل الزوار السريع ليقرأها زملاؤك.",
      ],
      controls: [
        { name: "منصة الشعار ثلاثي الأبعاد", desc: "اسحب الشعار لتدويره ومعاينته من جميع الزوايا." },
        { name: "الخط الزمني التاريخي", desc: "تسلسل المحطات والمناسبات البارزة في مسيرة الدفعة." },
        { name: "سجل الزوار السريع", desc: "أضف رسالة مودة ودعاء تظهر مباشرة في الصفحة الرئيسية." },
      ],
      tips: [
        "يمكنك تبديل المظهر الداكن والفاتح ولغة العرض من الأزرار في الزاوية العلوية.",
        "اضغط Ctrl + K (أو Cmd + K) في أي وقت للانتقال السريع بين الصفحات.",
      ],
    },
    direktori: {
      title: "دليل الخريجين",
      subtitle: "قاعدة بيانات الزملاء ووسائل التواصل",
      categoryLabel: "القائمة الرئيسية",
      summary:
        "دليل منظم لخريجي الدفعة ٤٣ يضم الأسماء والمدن الحالية وأزرار المراسلة عبر واتساب وحفظ بطاقات الاتصال.",
      howToUse: [
        "اكتب الاسم الكامل أو الكنية أو الفصل أو المدينة في حقل البحث.",
        "استخدم قوائم التصفية لتحديد البنين أو البنات والفصل النهائي.",
        "افتح بطاقة أي زميل للتواصل عبر واتساب أو تنزيل بطاقة الاتصال.",
      ],
      controls: [
        { name: "حقل البحث الفوري", desc: "بحث سريع بالاسم أو الكنية أو الفصل أو مدينة الإقامة." },
        { name: "تصفية الجنس والفصل", desc: "فرز قائمة الخريجين حسب البنين والبنات والفصل." },
        { name: "زر واتساب", desc: "يفتح محادثة واتساب مباشرة مع الزميل." },
        { name: "حفظ جهة الاتصال", desc: "ينزل ملف .vcf لإضافته مباشرة إلى هاتفك." },
      ],
      tips: [
        "حافظ على تحديث مدينتك ورقم هاتفك في ملفك الشخصي ليسهل تواصل الزملاء معك عند السفر.",
      ],
    },
    galeri: {
      title: "معرض الذكريات",
      subtitle: "أرشيف الصور والذكريات المصورة في المعهد",
      categoryLabel: "القائمة الرئيسية",
      summary:
        "أرشيف بصري يجمع توثيق الحياة الدراسية وحفل التخرج واللقاءات الأخوية ومشاركات الزملاء.",
      howToUse: [
        "اختر التبويب المناسب لتصفية الألبوم (البنين أو البنات أو الفعاليات العامة).",
        "اضغط على أي صورة لعرضها بدقة كاملة داخل العارض.",
        "شارك صورك الأرشيفية عبر نموذج الرفع لحفظها للأجيال.",
      ],
      controls: [
        { name: "تبويبات الألبوم", desc: "تصفية الصور حسب الجناح أو المناسبة." },
        { name: "الموسيقى الهادئة", desc: "تشغيل أو إيقاف الصوت التذكاري في الخلفية." },
        { name: "رفع الصور", desc: "مشاركة صور جديدة في أرشيف الدفعة." },
        { name: "تنزيل الصورة", desc: "حفظ الصورة بدقتها الكاملة على جهازك." },
      ],
      tips: [
        "أضف اسم المناسبة وسنتها عند الرفع ليسهل التعرف عليها في الأرشيف.",
      ],
    },
    radar: {
      title: "رادار انتشار الخريجين",
      subtitle: "خريطة التوزيع الجغرافي والكرة الأرضية",
      categoryLabel: "القائمة الرئيسية",
      summary:
        "خريطة تفاعلية وكرة أرضية ثلاثية الأبعاد تعرض توزيع خريجي الدفعة ٤٣ في مختلف المدن والدول.",
      howToUse: [
        "بدّل بين عرض الخريطة التفصيلية والكرة الأرضية من الشريط العلوي.",
        "راجع قائمة أبرز المدن لمعرفة تجمعات الخريجين.",
        "اضغط على أي علامة لعرض ملخص الزميل وفتح صفحته.",
      ],
      controls: [
        { name: "تبديل الخريطة والمجسم", desc: "الانتقال بين الخريطة ثنائية الأبعاد والكرة ثلاثية الأبعاد." },
        { name: "أبرز المدن", desc: "يعرض المدن التي تضم أكبر عدد من الخريجين." },
        { name: "تحديث الموقع", desc: "مزامنة إحداثيات مدينتك الحالية في ملفك الشخصي." },
        { name: "لوحة معلومات الخريج", desc: "عرض بيانات الزميل ورابط ملفه الكامل." },
      ],
      tips: [
        "حدّث موقع مدينتك عند الانتقال للدراسة أو العمل الجديد.",
      ],
    },
    syndicate: {
      title: "دليل مشاريع الخريجين",
      subtitle: "المتاجر والمبادرات والخدمات المهنية",
      categoryLabel: "القائمة الرئيسية",
      summary:
        "دليل يجمع مشاريع الخريجين التجارية والمنتجات والخدمات الاستشارية والمهنية للتكافل ودعم بعضهم البعض.",
      howToUse: [
        "ابحث أو صفِّ المشاريع حسب التخصص التجاري.",
        "افتح بطاقة أي مشروع للاطلاع على تفاصيله ومراسلة صاحبه via واتساب.",
        "سجل مشروعك من خلال زر إضافة مشروع.",
      ],
      controls: [
        { name: "تسجيل مشروع", desc: "إضافة اسم النشاط ووصفه ورقم واتساب للتواصل." },
        { name: "تصفية التصنيفات", desc: "عرض المشاريع حسب القطاع المهني." },
        { name: "الطلب عبر واتساب", desc: "التواصل مباشرة مع صاحب المشروع الخريج." },
      ],
      tips: [
        "يمكنك مشاركة رابط صفحة متجرك العامة مع العملاء مباشرة.",
      ],
    },
    fitur: {
      title: "مركز الخدمات والميزات",
      subtitle: "بوابة الوصول الشامل لأقسام المنظومة",
      categoryLabel: "القائمة الرئيسية",
      summary:
        "فهرس منظم لأدوات العبادة وغرف التواصل والمعارض والأدوات التفاعلية المتاحة داخل البوابة.",
      howToUse: [
        "تصفح الأقسام المصنفة حسب العبادة والتواصل والأدوات التفاعلية.",
        "اختر أي بطاقة للانتقال مباشرة إلى صفحتها.",
      ],
      controls: [
        { name: "بطاقات الخدمات", desc: "فتح الأداة أو الصفحة المحددة مباشرة." },
      ],
      tips: [
        "أضف البوابة إلى الشاشة الرئيسية في هاتفك للوصول اليومي السريع للقرآن والمأثورات.",
      ],
    },
    profil: {
      title: "الملف الشخصي والحساب",
      subtitle: "إدارة البيانات والصورة الشخصية والتفضيلات",
      categoryLabel: "القائمة الرئيسية",
      summary:
        "صفحة تحديث بياناتك الشخصية في الدليل واقتصاص الصورة المربعة وتغيير اللغة وكلمة المرور والوصول إلى بطاقة العضوية.",
      howToUse: [
        "حدّث بيانات الهوية والتواصل والاهتمامات عبر خطوات الملف ثم احفظها.",
        "ارفع صورتك الشخصية واضبط الإطار المربع ١:١ قبل الحفظ.",
        "اختر لغة البوابة (الإندونيسية أو العربية أو الإنجليزية) أو عدّل كلمة المرور.",
      ],
      controls: [
        { name: "اقتصاص الصورة", desc: "تعديل الصورة الشخصية بنسبة ١:١ للدليل والبطاقة." },
        { name: "حفظ التغييرات", desc: "تحديث بياناتك في قاعدة البيانات." },
        { name: "الأمان واللغة", desc: "تغيير كلمة المرور وإعدادات التنبيه واللغة." },
        { name: "بطاقة العضوية 3D", desc: "معاينة بطاقة الخريج التفاعلية." },
      ],
      tips: [
        "إكمال جميع حقول السيرة يساعد الزملاء في العثور عليك في الدليل ونيكسوس.",
      ],
    },
    "chat-lounge": {
      title: "ملتقى الدفعة العام",
      subtitle: "غرفة الحوار المباشر بين الخريجين",
      categoryLabel: "التواصل",
      summary:
        "غرفة محادثة فورية تدعم الرسائل النصية والمقاطع الصوتية والصور لمتابعة أخبار الزملاء يومياً.",
      howToUse: [
        "اكتب رسالتك في الشريط السفلي واضغط إرسال للمشاركة.",
        "استخدم زر الميكروفون أو الصورة لإرسال تسجيل صوتي أو صورة.",
      ],
      controls: [
        { name: "تسجيل صوتي", desc: "تسجيل وإرسال رسالة صوتية مباشرة." },
        { name: "مقطع فيديو", desc: "مشاركة مقاطع فيديو قصيرة داخل الملتقى." },
        { name: "رفع صورة", desc: "إرسال صورة تذكارية في المحادثة." },
        { name: "الرموز التعبيرية", desc: "اختيار تعبير مناسب لرسالتك." },
      ],
      tips: [
        "التزم بأدب الحوار والاحترام المتبادل بما يليق بأخلاق أبناء المعهد.",
      ],
    },
    "chat-personal": {
      title: "المحادثة الخاصة والاتصال",
      subtitle: "مراسلة فردية ومكالمات صوت ومرئي",
      categoryLabel: "التواصل",
      summary:
        "محادثة خاصة مباشرة بين زميلين مع دعم مكالمات الصوت والفيديو عبر WebRTC داخل المتصفح.",
      howToUse: [
        "اختر زميلاً من قائمة جهات الاتصال لفتح المحادثة الفردية.",
        "اضغط زر الهاتف أو الكاميرا في الشريط العلوي لبدء مكالمة.",
      ],
      controls: [
        { name: "مكالمة صوتية", desc: "بدء اتصال صوتي مباشر عبر المتصفح." },
        { name: "مكالمة فيديو", desc: "إجراء مكالمة مرئية مباشرة مع زميلك." },
        { name: "حذف الرسالة", desc: "إزالة رسالتك المرسلة عند الحاجة." },
      ],
      tips: [
        "اسمح للمتصفح بالوصول إلى الميكروفون والكاميرا عند بدء المكالمة.",
      ],
    },
    birthday: {
      title: "تهاني يوم الميلاد",
      subtitle: "تقويم أعياد ميلاد الزملاء والدعاء لهم",
      categoryLabel: "التواصل",
      summary:
        "متابعة الزملاء الذين يصادف يوم ميلادهم اليوم أو خلال الشهر الجاري وإرسال الدعاء الصادق بالبركة والتوفيق.",
      howToUse: [
        "اطلع على قائمة مواليد اليوم أو مواليد هذا الشهر.",
        "اضغط زر إرسال التهنئة لمشاركة دعاء مكتوب للزميل.",
      ],
      controls: [
        { name: "مواليد اليوم", desc: "عرض الخريجين الذين يصادف ميلادهم اليوم." },
        { name: "إرسال دعاء وتهنئة", desc: "نشر رسالة دعاء وتهنئة في صفحة الزميل." },
      ],
      tips: [
        "تأكد من صحة تاريخ ميلادك في الملف الشخصي ليظهر لزملائك.",
      ],
    },
    "buku-tamu": {
      title: "سجل الزوار الرقمي",
      subtitle: "كلمات المودة والدعاء المشترك",
      categoryLabel: "التواصل",
      summary:
        "دفتر زوار مفتوح لتدوين الذكريات والرسائل الأخوية والدعاء للمشايخ وزملاء الدفعة.",
      howToUse: [
        "اكتب اسمك ورسالتك الأخوية ثم أرسلها إلى السجل.",
        "بدّل ترتيب العرض لمتابعة أحدث المشاركات.",
      ],
      controls: [
        { name: "نموذج الكتابة", desc: "حقل تدوين الرسائل والذكريات للدفعة." },
        { name: "فرز المشاركات", desc: "عرض أحدث الملاحظات أو تصفية الترتيب." },
      ],
      tips: [
        "اذكر مدينتك الحالية في تحيتك ليعلم من يزورها من الزملاء بمكانك.",
      ],
    },
    event: {
      title: "الفعاليات واللقاءات",
      subtitle: "جدول الملتقيات واجتماعات لم الشمل",
      categoryLabel: "التواصل",
      summary:
        "تقويم الفعاليات الإقليمية واللقاءات السنوية مع عداد تنازلي وتأكيد الحضور وروابط خرائط المواقع.",
      howToUse: [
        "تحقق من الموعد والعنوان والعداد التنازلي لكل مناسبة.",
        "اضغط زر تأكيد الحضور لمساعدة المنظمين في الترتيب والضيافة.",
      ],
      controls: [
        { name: "تأكيد الحضور", desc: "تسجيل حضورك الفعلي لمساعدة اللجنة التنظيمية." },
        { name: "الاتجاهات على الخريطة", desc: "فتح موقع الفعالية في خرائط Google." },
        { name: "العداد التنازلي", desc: "الوقت المتبقي على موعد انطلاق اللقاء." },
      ],
      tips: [
        "أبلغ اللجنة مبكراً عند اعتذارك لتحديث كشوف الضيافة.",
      ],
    },
    "baitul-maal": {
      title: "بيت المال والتبرعات",
      subtitle: "شفافية الصندوق والتكافل الاجتماعي",
      categoryLabel: "الاجتماعي والعبادة",
      summary:
        "سجل مالي شفاف يوضح الواردات والمصروفات الاجتماعية وصناديق التكافل مع إمكانية تأكيد الحوالات وطباعة الإيصالات.",
      howToUse: [
        "استعرض ملخص الرصيد وحركة الصندوق في اللوحة الرئيسية.",
        "انسخ رقم الحساب المعتمد وأكّد بيانات التحويل بعد السداد.",
      ],
      controls: [
        { name: "نسخ رقم الحساب", desc: "نسخ رقم حساب أمين الصندوق للحوالات المالية." },
        { name: "تأكيد التحويل", desc: "تسجيل بيانات الحوالة للمراجعة والاعتماد." },
        { name: "ملخص التدفق المالي", desc: "عرض نسب توزيع الصدقات والأنشطة الاجتماعية." },
      ],
      tips: [
        "يمكنك حفظ أو طباعة إيصال التبرع من قائمة معاملاتك.",
      ],
    },
    multazam: {
      title: "حائط الدعاء (الملتزم)",
      subtitle: "تبادل الدعوات وقول آمين",
      categoryLabel: "الاجتماعي والعبادة",
      summary:
        "مساحة هادئة لتقديم طلبات الدعاء لشفاء الوالدين وتيسير الأرزاق والتوفيق في الدراسة والعمل، ومشاركة الإخوة بقول آمين.",
      howToUse: [
        "اقرأ دعوات الزملاء واضغط زر آمين للمشاركة في الدعاء.",
        "أضف دعاءك الخاص باسمك أو بشكل مجهول عبر النموذج.",
      ],
      controls: [
        { name: "زر آمين", desc: "إضافة تأمينك على دعاء زميلك في السجل." },
        { name: "إضافة دعاء", desc: "نشر طلب دعاء جديد في الحائط." },
        { name: "تصفية المواضيع", desc: "ترتيب الدعوات حسب الفئة أو الحاجة." },
      ],
      tips: [
        "لا تنسَ الدعاء لإخوانك بظهر الغيب في أوقات الإجابة.",
      ],
    },
    majlis: {
      title: "مجلس العلم والمذاكرة",
      subtitle: "دروس علمية وتسجيلات التوجيهات",
      categoryLabel: "الاجتماعي والعبادة",
      summary:
        "فضاء علمي يضم مواعيد الحلقات الدورية وتسجيلات المحاضرات وإتاحة طرح الأسئلة على المشايخ والأساتذة.",
      howToUse: [
        "تابع جدول الدروس القادمة وشغل التسجيلات المتوفرة.",
        "أرسل أسئلتك الشرعية أو التربوية عبر نموذج المشاركة.",
      ],
      controls: [
        { name: "مشغل الصوت", desc: "الاستماع إلى تسجيلات المواعظ داخل المتصفح." },
        { name: "إرسال سؤال", desc: "طرح استفسار علمي قبل الجلسة التالية." },
        { name: "الأرشيف الصوتي", desc: "الرجوع إلى الدروس السابقة في أي وقت." },
      ],
      tips: [
        "استفد من التسجيلات الصوتية أثناء التنقل اليومي.",
      ],
    },
    tarbiyah: {
      title: "شبكة الإرشاد والوظائف",
      subtitle: "التوجيه المهني وفرص العمل بين الخريجين",
      categoryLabel: "الاجتماعي والعبادة",
      summary:
        "منصة استشارات تربوية ومهنية تربط الخريجين الجدد بأصحاب الخبرة وتجمع فرص التوظيف الموثوقة داخل الدفعة.",
      howToUse: [
        "ابحث عن مرشد حسب التخصص أو استعرض فرص العمل المنشورة.",
        "تواصل مباشرة عبر بيانات الاتصال المرفقة بكل إعلان.",
      ],
      controls: [
        { name: "طلب استشارة", desc: "توجيه استفسار مهني أو أكاديمي لمشرف متخصص." },
        { name: "فرص التوظيف", desc: "تصفح الوظائف المشاركة من أعضاء الدفعة." },
      ],
      tips: [
        "أضف مجال خبرتك في الملف الشخصي إذا رغبت في إرشاد زملائك.",
      ],
    },
    wasiat: {
      title: "رسائل المستقبل والوصايا",
      subtitle: "كبسولة زمنية لحفظ النصائح الأخوية",
      categoryLabel: "الاجتماعي والعبادة",
      summary:
        "حافظة رقمية لحفظ الرسائل الصادقة والوصايا المؤجلة التي تفتح في مواعيد مستقبلية محددة للدفعة.",
      howToUse: [
        "اكتب رسالتك وحدد سنة أو تاريخ فتح الرسالة المستقبلي.",
        "تابع عداد الرسائل المغلقة أو افتح ما حلّ موعده.",
      ],
      controls: [
        { name: "ختم الرسالة", desc: "قفل الرسالة حتى تاريخ الاستحقاق المختار." },
        { name: "حالة الفتح", desc: "عرض الوقت المتبقي لفتح كل كبسولة." },
      ],
      tips: [
        "اكتب نصيحة صادقة لزملائك تُقرأ في اللقاء الكبير القادم.",
      ],
    },
    kontemplasi: {
      title: "غرفة التأمل والذكر",
      subtitle: "تلاوات قرآنية هادئة وأجواء سكينة",
      categoryLabel: "الاجتماعي والعبادة",
      summary:
        "بيئة هادئة للتدبر والذكر تجمع بين تلاوة السور القرآنية وأصوات الطبيعة الهادئة مع وضع عرض مريح.",
      howToUse: [
        "اختر التلاوة المناسبة وفعل الصوت المحيطي الهادئ إن رغبت.",
        "استخدم وضع ملء الشاشة للتركيز أثناء الأذكار أو الراحة.",
      ],
      controls: [
        { name: "مشغل التلاوة", desc: "تشغيل وإيقاف التلاوات المختارة." },
        { name: "وضع السكون الكامل", desc: "إخفاء القوائم للتركيز في التدبر." },
        { name: "صوت الطبيعة", desc: "مزج صوت المطر والماء بهدوء في الخلفية." },
      ],
      tips: [
        "استخدم سماعات الأذن للحصول على أفضل توازن صوتي.",
      ],
    },
    sovereign: {
      title: "بطاقة الخريج الرقمية 3D",
      subtitle: "الهوية الرسمية التفاعلية لدفعة ٤٣",
      categoryLabel: "الميزات الحصرية",
      badge: "بطاقة تفاعلية",
      summary:
        "بطاقة عضوية رقمية ثلاثية الأبعاد بهويتك المعتمدة ورمز استجابة سريعة للتحقق مع إمكانية حفظها كصورة عالية الدقة.",
      howToUse: [
        "اسحب البطاقة لتدويرها ورؤية الوجهين الأمامي والخلفي.",
        "بدّل بين المظهر الداكن الذهبي والمظهر العاجي الفاتح.",
        "اضغط حفظ كصورة PNG لتنزيل البطاقة وطباعتها.",
      ],
      controls: [
        { name: "تدوير ٣٦٠ درجة", desc: "معاينة البطاقة من مختلف الزوايا." },
        { name: "تبديل التصميم", desc: "الاختيار بين السمة الذهبية الداكنة والسمة العاجية." },
        { name: "حفظ الصورة", desc: "تصدير ملف PNG جاهز للطباعة والحفظ." },
        { name: "رمز التحقق", desc: "رمز QR يربط بملف الخريج الموثق." },
      ],
      tips: [
        "ارفع صورة واضحة بنسبة مربعة في الملف الشخصي قبل تنزيل بطاقتك.",
      ],
    },
    photobooth: {
      title: "استوديو الصور التذكارية",
      subtitle: "تصميم شريط صور بـ ٤ لقطات",
      categoryLabel: "الميزات الحصرية",
      badge: "كاميرا تفاعلية",
      summary:
        "التقط أربع لقطات بالكاميرا أو ارفع صوراً من جهازك لتنسيق شريط صور تذكاري للقاءات بإطارات وعبارات مخصصة.",
      howToUse: [
        "اختر التصوير بالكاميرا بالمؤقت أو رفع ٤ صور من المعرض.",
        "اختر الإطار والألوان والنص السفلي ثم نزّل الشريط النهائي.",
      ],
      controls: [
        { name: "زر الالتقاط", desc: "بدء سلسلة تصوير أربع لقطات متتابعة." },
        { name: "تبديل الكاميرا", desc: "التبديل بين الكاميرا الأمامية والخلفية." },
        { name: "خيارات الإطار", desc: "تغيير ألوان الشريط والزخارف والعناوين." },
        { name: "حفظ الشريط", desc: "تصدير شريط الصور بدقة واضحة لمشاركته." },
      ],
      tips: [
        "ممتاز للتصوير الجماعي مع الزملاء في اللقاءات الدورية.",
      ],
    },
    scanner: {
      title: "ماسح رمز الخريج",
      subtitle: "قراءة فورية لرمز QR والتحقق",
      categoryLabel: "الميزات الحصرية",
      summary:
        "ماسح ضوئي عبر الكاميرا لقراءة رموز بطاقات الخريجين في الملتقيات والانتقال فوراً إلى ملفهم الرسمي.",
      howToUse: [
        "اسمح بالكاميرا ووجّه الإطار نحو رمز QR على بطاقة زميلك.",
        "انتقل مباشرة إلى ملف الزميل عند التعرف على الرمز.",
      ],
      controls: [
        { name: "إطار المسح", desc: "قراءة فورية لرموز الاستجابة الخاصة بالخريجين." },
        { name: "تبديل العدسة", desc: "التحويل بين الكاميرا الخلفية والأمامية." },
      ],
      tips: [
        "تأكد من وضوح الإضاءة وتثبيت الكاميرا لقراءة أسرع.",
      ],
    },
    wrapped: {
      title: "ملخص مسيرة الدفعة",
      subtitle: "إحصائيات وشرائح رحلة إكسبيدينت",
      categoryLabel: "الميزات الحصرية",
      badge: "شرائح عرض",
      summary:
        "عرض تفاعلي يلخص أعداد الخريجين والمدن والصور الأرشيفية ومحطات الدفعة في بطاقات متتابعة.",
      howToUse: [
        "انقر على جانبي الشاشة أو الأزرار للتنقل بين شرائح التقرير.",
        "استخدم زر المشاركة لحفظ الشريحة التي تفضلها.",
      ],
      controls: [
        { name: "التنقل بين الشرائح", desc: "استعراض الشرائح الإحصائية المتتابعة." },
        { name: "حفظ ومشاركة", desc: "مشاركة ملخص الأرقام مع مجموعات الدفعة." },
      ],
      tips: [
        "تنمو الأرقام وتحدث مع تفاعل الزملاء ومشاركاتهم.",
      ],
    },
    download: {
      title: "مركز التنزيل والتثبيت",
      subtitle: "تطبيق أندرويد APK وإضافة آيفون على الشاشة",
      categoryLabel: "الميزات الحصرية",
      summary:
        "إرشادات تنزيل حزمة أندرويد الرسمية أو إضافة بوابة الخريجين كتطبيق ويب على شاشة آيفون وأندرويد الرئيسية.",
      howToUse: [
        "لأجهزة أندرويد: نزل ملف APK الرسمي واضغط تثبيت بعد السماح بالمصدر.",
        "لأجهزة آيفون: افتح البوابة في سفاري، اضغط زر المشاركة ثم إضافة إلى الصفحة الرئيسية.",
        "افتح أيقونة إكسبيدينت ٤٣ مباشرة من شاشة الهاتف بملء الشاشة.",
      ],
      controls: [
        { name: "تنزيل ملف Android (.APK)", desc: "الحصول على ملف التثبيت الرسمي لأندرويد." },
        { name: "ألسنة التعليمات", desc: "خطوات مفصلة لأندرويد وسفاري آيفون وتطبيق الويب." },
      ],
      tips: [
        "التحذير الأمني عند التثبيت في أندرويد قياسي لأي تطبيق من خارج متجر Play.",
      ],
    },
    celestial: {
      title: "درر الحكمة والمواعظ",
      subtitle: "مختارات من نصائح المشايخ والأساتذة",
      categoryLabel: "الميزات الحصرية",
      summary:
        "مجموعة من الكلمات التربوية والتوجيهات الحكيمة من قادة معهد الرسالة والأساتذة للاستضاءة بها في الحياة اليومية.",
      howToUse: [
        "تصفح البطاقات أو استخدم زر النسخ لمشاركة الحكمة مع أهلك وزملائك.",
      ],
      controls: [
        { name: "نسخ الحكمة", desc: "نسخ نص المقولة المنسق إلى الحافظة فوراً." },
      ],
      tips: [
        "اجعل لنفسك ورداً يومياً من قراءة توجيهات المشايخ ومراجعتها.",
      ],
    },
    divine: {
      title: "آية اليوم وتدبرها",
      subtitle: "آيات مختارة وأحاديث نبوية مع التلاوة",
      categoryLabel: "الميزات الحصرية",
      summary:
        "عرض يومي لآية قرآنية أو حديث شريف بالرسم العثماني والترجمة والتفسير الموجز مع تلاوة صوتية.",
      howToUse: [
        "اقرأ آية اليوم والتأمل المرفق، واضغط زر الصوت لسماع التلاوة.",
      ],
      controls: [
        { name: "تشغيل التلاوة", desc: "سماع تلاوة الآية المعروضة بصوت واضح." },
      ],
      tips: [
        "عد للصفحة بانتظام لمتابعة المختارات الدورية والتذكير بالآيات.",
      ],
    },
    genesis: {
      title: "فلسفة الدفعة وتاريخها",
      subtitle: "القيم الخمس ومعنى اسم إكسبيدينت",
      categoryLabel: "الميزات الحصرية",
      summary:
        "توثيق لنشأة الاسم ومعاني الشعار الرسمي ذي الدائرة الذهبية والقيم الخمس التي غرسها المعهد.",
      howToUse: [
        "اقرأ المحاور التوثيقية من نشأة المعهد حتى حفل الدفعة.",
      ],
      controls: [
        { name: "استكشاف الفلسفة", desc: "عرض شرح العناصر الرمزية لشعار الدفعة." },
      ],
      tips: [
        "مرجع تعريفي مناسب لمشاركته مع الأسرة والأبناء عن قيم المعهد.",
      ],
    },
    nexus: {
      title: "موافق الاهتمامات والمدن",
      subtitle: "العثور على زملاء بنفس المدينة والتخصص",
      categoryLabel: "الميزات الحصرية",
      summary:
        "أداة تقيس تشابه مدينتك وتخصصك واهتماماتك المسجلة مع ملفات الزملاء الموثقين لترشيح أقربهم توافقاً.",
      howToUse: [
        "تأكد من تعبئة المدينة والمهنة والاهتمامات في ملفك الشخصي.",
        "اضغط زر الفحص لحساب درجة التشابه الموضوعي وترتيب النتائج.",
      ],
      controls: [
        { name: "بدء المطابقة", desc: "حساب التشابه بناءً على تطابق المدينة والكلمات المفتاحية." },
      ],
      tips: [
        "كتابة اهتمامات دقيقة في ملفك يرفع دقة نتائج المطابقة.",
      ],
    },
    enigma: {
      title: "المفكرة الخاصة المشفرة",
      subtitle: "تدوين شخصي محمي بكلمة عبور",
      categoryLabel: "الميزات الحصرية",
      summary:
        "دفتر يوميات خاص لتسجيل خواطرك ومذكراتك الشخصية وحفظها محلياً بحماية كلمة مرور.",
      howToUse: [
        "افتح الخزنة بعبارة المرور الخاصة بك ثم أنشئ مذكرة جديدة.",
        "احفظ نسخة احتياطية قبل تغيير جهازك.",
      ],
      controls: [
        { name: "إضافة مذكرة", desc: "فتح صفحة تدوين جديدة مؤرخة." },
      ],
      tips: [
        "تذكّر كلمة العبور جيداً لأن المذكرات المحلية المشفرة لا تُسترد دونها.",
      ],
    },
    oracle: {
      title: "كاميرا التفاؤل واللقطات",
      subtitle: "تحليل إطار الكاميرا ورسائل التشجيع",
      categoryLabel: "الميزات الحصرية",
      summary:
        "أداة كاميرا تفاعلية تحلل إطار الفيديو من كاميرا جهازك وتعرض لك رسالة تشجيع أخوية.",
      howToUse: [
        "اسمح بالكاميرا مؤقتاً عند البدء ثم التقط لحظة مبتسمة.",
      ],
      controls: [
        { name: "التقاط لحظة", desc: "قراءة إطار الكاميرا وإظهار رسالة التفاؤل." },
      ],
      tips: [
        "تعمل المعالجة محلياً في المتصفح دون رفع صورك إلا إذا قمت بحفظها.",
      ],
    },
    "admin-users": {
      title: "إدارة الأعضاء والخريجين",
      subtitle: "توثيق الحسابات والصلاحيات",
      categoryLabel: "إدارة المشرفين",
      badge: "للمشرفين",
      summary:
        "لوحة التحكم بمراجعة المسجلين الجدد وتحديث بيانات الفصول ومنح صلاحيات الإدارة وإزالة الحسابات عند الحاجة.",
      howToUse: [
        "ابحث عن العضو بالاسم أو البريد وتحقق من بياناته.",
        "عدّل الدور أو استخدم إجراء الحذف المؤكد عند اللزوم.",
      ],
      controls: [
        { name: "تعديل الصلاحيات", desc: "تغيير دور العضو بين مستخدم ومشرف." },
        { name: "إدارة الحساب", desc: "إجراء مؤكد لإزالة أو إيقاف حساب غير صالح." },
      ],
      tips: [
        "تحقق دائماً من هوية الزميل وبريده قبل ترقية أي صلاحية إدارية.",
      ],
    },
    "admin-cms": {
      title: "إدارة محتوى الموقع",
      subtitle: "تحديث النصوص والصور بدون برمجة",
      categoryLabel: "إدارة المشرفين",
      badge: "للمشرفين",
      summary:
        "محرر لنصوص الواجهة الرئيسية والفعاليات والصور المخزنة لحفظ التعديلات مباشرة عبر Supabase.",
      howToUse: [
        "اختر التبويب المناسب وعدّل العناوين أو الصور ثم احفظ.",
      ],
      controls: [
        { name: "محرر النصوص", desc: "تعديل العناوين والفقرات المعروضة." },
        { name: "رفع الصور", desc: "تحسين وضغط الصور قبل حفظها." },
        { name: "حفظ المحتوى", desc: "نشر التحديثات إلى قاعدة البيانات." },
      ],
      tips: [
        "راجع الصفحة بالمظهرين الداكن والفاتح بعد حفظ أي تعديل.",
      ],
    },
    "admin-broadcast": {
      title: "الإشعارات والبث الجماعي",
      subtitle: "إرسال التنبيهات والإعلانات الرسمية",
      categoryLabel: "إدارة المشرفين",
      badge: "للمشرفين",
      summary:
        "إرسال الإعلانات المهمة ومواعيد اللقاءات وأخبار المواساة عبر إشعارات الدفعة.",
      howToUse: [
        "اكتب عنواناً موجزاً ونصاً واضحاً ثم حدد الفئة المستهدفة وأرسل.",
      ],
      controls: [
        { name: "إرسال البث", desc: "تشغيل طابور الإشعارات الفورية للخريجين." },
        { name: "تصفية المستلمين", desc: "توجيه الإعلان حسب المدينة أو المجموعة." },
      ],
      tips: [
        "اجعل العناوين مختصرة وواضحة كي تظهر كاملة في إشعارات الهواتف.",
      ],
    },
    "admin-moderation": {
      title: "مراقبة المحتوى والبلاغات",
      subtitle: "ضبط الرسائل وحفظ نظام المنصة",
      categoryLabel: "إدارة المشرفين",
      badge: "للمشرفين",
      summary:
        "مراجعة المشاركات المبلغ عنها أو غير الملائمة في الغرف العامة واتخاذ إجراء الإزالة المؤكد.",
      howToUse: [
        "افحص سجل المشاركات الحديثة واستخدم الحذف المؤكد للمحتوى المخالف.",
      ],
      controls: [
        { name: "حذف المشاركة", desc: "إزالة المحتوى المخالف بعد تأكيد الإجراء." },
      ],
      tips: [
        "تواصل بأسلوب أخوي مع الزملاء لتوضيح ضوابط النشر عند اللزوم.",
      ],
    },
    "admin-export": {
      title: "تصدير البيانات والنسخ الاحتياطي",
      subtitle: "تنزيل الجداول بصيغ CSV و JSON",
      categoryLabel: "إدارة المشرفين",
      badge: "للمشرفين",
      summary:
        "تنزيل كشوف الخريجين وتأكيدات الحضور وسجلات البيت المالي لتنسيق اللجان.",
      howToUse: [
        "اختر الجدول المطلوب واضغط زر التنزيل لحفظ الملف على جهازك.",
      ],
      controls: [
        { name: "تنزيل الملف", desc: "تصدير بيانات جاهزة للفتح في برامج الجداول." },
      ],
      tips: [
        "احفظ بيانات التواصل بأمان ولا تنشرها خارج اللجان المعتمدة.",
      ],
    },
    "admin-wallet": {
      title: "منشئ البطاقات الجماعي",
      subtitle: "توليد بطاقات العضوية للدفعة",
      categoryLabel: "إدارة المشرفين",
      badge: "للمشرفين",
      summary:
        "إنتاج حزم بطاقات الأعضاء الجاهزة للطباعة أو التوزيع في فعاليات اللقاء الكبير.",
      howToUse: [
        "اختر قائمة الأعضاء واضغط بدء التوليد ثم نزّل الملف المجمع.",
      ],
      controls: [
        { name: "بدء التوليد", desc: "معالجة وتصميم بطاقات الأعضاء تلقائياً." },
        { name: "تنزيل الأرشيف", desc: "حفظ جميع البطاقات في ملف مضغوط." },
      ],
      tips: [
        "تأكد من تحديث الصور الشخصية للزملاء قبل الطباعة الجماعية.",
      ],
    },
  },
};

export function getLocalizedCategories(locale: GuideLocale) {
  if (locale === "id") return CATEGORIES;
  return CATEGORIES.map((cat) => ({
    ...cat,
    label: CATEGORY_LABELS[locale][cat.id] || cat.label,
  }));
}

export function getLocalizedGuide(guide: PageGuide, locale: GuideLocale): PageGuide {
  if (locale === "id") return guide;
  const t = GUIDE_TRANSLATIONS[locale][guide.id];
  if (!t) return guide;
  return {
    ...guide,
    title: t.title,
    subtitle: t.subtitle,
    categoryLabel: t.categoryLabel,
    badge: t.badge,
    summary: t.summary,
    howToUse: t.howToUse,
    controls: guide.controls.map((ctrl, idx) => ({
      ...ctrl,
      name: t.controls[idx]?.name || ctrl.name,
      desc: t.controls[idx]?.desc || ctrl.desc,
    })),
    tips: t.tips,
    faq: t.faq || guide.faq,
  };
}

export function getLocalizedGuides(locale: GuideLocale): PageGuide[] {
  return PAGE_GUIDES.map((g) => getLocalizedGuide(g, locale));
}

export function getLocalizedGuideByPath(pathname: string, locale: GuideLocale): PageGuide | undefined {
  const base = getGuideByPath(pathname);
  return base ? getLocalizedGuide(base, locale) : undefined;
}
