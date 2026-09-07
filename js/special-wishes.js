/* =========================================================
   iTech IT Solutions
   AUTOMATIC SPECIAL DAYS / HOLIDAYS WISH ENGINE
   2026 - 2030

   No admin entry required.

   IMPORTANT:
   - Fixed dates are automatic.
   - Kerala festival dates are year-wise.
   - Islamic dates are marked as approximate/tentative where
     they depend on lunar observation.
   ========================================================= */

(function () {
  "use strict";

  /* =======================================================
     SETTINGS
     ======================================================= */

  const SETTINGS = {
    autoCloseMs: 9000,

    /* Show only once per browser per day */
    showOncePerDay: true,

    /* Set false if you want it every page load */
    rememberShown: true
  };


  /* =======================================================
     FIXED / ANNUAL DAYS
     ======================================================= */

  const annualDays = {

    "01-01": {
      priority: 90,
      emoji: "🎉",
      title: "Happy New Year!",
      message:
        "iTech IT Solutions കുടുംബത്തിന്റെ ഹൃദയം നിറഞ്ഞ പുതുവത്സരാശംസകൾ!"
    },

    "01-12": {
      priority: 40,
      emoji: "💻",
      title: "National Youth Day",
      message:
        "എല്ലാ യുവജനങ്ങൾക്കും iTech IT Solutions-ന്റെ ഹൃദയം നിറഞ്ഞ ആശംസകൾ!"
    },

    "01-24": {
      priority: 35,
      emoji: "📚",
      title: "International Day of Education",
      message:
        "വിദ്യാഭ്യാസത്തിന്റെ മഹത്വം ഓർമ്മിപ്പിക്കുന്ന ഈ ദിനത്തിൽ എല്ലാവർക്കും ആശംസകൾ!"
    },

    "01-26": {
      priority: 100,
      emoji: "🇮🇳",
      title: "Happy Republic Day!",
      message:
        "iTech IT Solutions-ന്റെ ഹൃദയം നിറഞ്ഞ റിപ്പബ്ലിക് ദിനാശംസകൾ!"
    },

    "02-04": {
      priority: 30,
      emoji: "💻",
      title: "World Computer Day",
      message:
        "സാങ്കേതികവിദ്യയുടെ ലോകത്തേക്ക് കൂടുതൽ മുന്നേറാം!"
    },

    "02-14": {
      priority: 30,
      emoji: "❤️",
      title: "Happy Valentine's Day!",
      message:
        "സ്നേഹത്തിന്റെയും സൗഹൃദത്തിന്റെയും ഹൃദയം നിറഞ്ഞ ആശംസകൾ!"
    },

    "02-21": {
      priority: 30,
      emoji: "🌍",
      title: "International Mother Language Day",
      message:
        "നമ്മുടെ മാതൃഭാഷയെ സ്നേഹിക്കാം, സംരക്ഷിക്കാം!"
    },

    "03-08": {
      priority: 50,
      emoji: "🌸",
      title: "Happy Women's Day!",
      message:
        "എല്ലാ വനിതകൾക്കും iTech IT Solutions-ന്റെ ഹൃദയം നിറഞ്ഞ വനിതാദിനാശംസകൾ!"
    },

    "03-22": {
      priority: 30,
      emoji: "💧",
      title: "World Water Day",
      message:
        "ജലം സംരക്ഷിക്കാം, ഭാവി സംരക്ഷിക്കാം!"
    },

    "04-07": {
      priority: 30,
      emoji: "❤️",
      title: "World Health Day",
      message:
        "എല്ലാവർക്കും ആരോഗ്യവും സന്തോഷവും നിറഞ്ഞ ജീവിതം ആശംസിക്കുന്നു!"
    },

    "04-22": {
      priority: 30,
      emoji: "🌍",
      title: "Earth Day",
      message:
        "നമ്മുടെ ഭൂമിയെ സംരക്ഷിക്കാം. ഹരിതമായൊരു നാളേക്കായി ഒരുമിച്ച് മുന്നോട്ട്!"
    },

    "05-01": {
      priority: 70,
      emoji: "👷",
      title: "Happy Labour Day!",
      message:
        "എല്ലാ തൊഴിലാളികൾക്കും iTech IT Solutions-ന്റെ ഹൃദയം നിറഞ്ഞ തൊഴിലാളി ദിനാശംസകൾ!"
    },

    "05-31": {
      priority: 30,
      emoji: "🚭",
      title: "World No Tobacco Day",
      message:
        "ആരോഗ്യകരമായ ജീവിതത്തിനായി നല്ല ശീലങ്ങൾ പിന്തുടരാം!"
    },

    "06-05": {
      priority: 40,
      emoji: "🌱",
      title: "World Environment Day",
      message:
        "പ്രകൃതിയെ സംരക്ഷിക്കാം. ഹരിതമായ ഭാവിക്കായി ഒരുമിച്ച് മുന്നോട്ട്!"
    },

    "06-21": {
      priority: 30,
      emoji: "🧘",
      title: "International Yoga Day",
      message:
        "ആരോഗ്യവും സമാധാനവും നിറഞ്ഞ ജീവിതം ആശംസിക്കുന്നു!"
    },

    "07-11": {
      priority: 25,
      emoji: "🌍",
      title: "World Population Day",
      message:
        "നല്ലൊരു ഭാവിക്കായി ഉത്തരവാദിത്തത്തോടെ മുന്നേറാം!"
    },

    "08-15": {
      priority: 100,
      emoji: "🇮🇳",
      title: "Happy Independence Day!",
      message:
        "iTech IT Solutions-ന്റെ ഹൃദയം നിറഞ്ഞ സ്വാതന്ത്ര്യദിനാശംസകൾ!"
    },

    "08-29": {
      priority: 30,
      emoji: "🏃",
      title: "National Sports Day",
      message:
        "ആരോഗ്യകരമായ ജീവിതത്തിനായി കായികരംഗത്തെ പ്രോത്സാഹിപ്പിക്കാം!"
    },

    "09-05": {
      priority: 45,
      emoji: "👨‍🏫",
      title: "Happy Teachers' Day!",
      message:
        "എല്ലാ അധ്യാപകർക്കും iTech IT Solutions-ന്റെ ഹൃദയം നിറഞ്ഞ അധ്യാപക ദിനാശംസകൾ!"
    },

    "09-08": {
      priority: 25,
      emoji: "📖",
      title: "International Literacy Day",
      message:
        "വിദ്യാഭ്യാസത്തിലൂടെ അറിവും അവസരങ്ങളും വളർത്താം!"
    },

    "09-15": {
      priority: 25,
      emoji: "🛡️",
      title: "Engineer's Day",
      message:
        "എല്ലാ എഞ്ചിനീയർമാർക്കും ഹൃദയം നിറഞ്ഞ ആശംസകൾ!"
    },

    "10-02": {
      priority: 90,
      emoji: "🕊️",
      title: "Gandhi Jayanti",
      message:
        "ഗാന്ധിജയന്തി ആശംസകൾ!"
    },

    "10-24": {
      priority: 25,
      emoji: "🌍",
      title: "United Nations Day",
      message:
        "സമാധാനത്തിനും ഐക്യത്തിനും വേണ്ടി ഒരുമിച്ച് മുന്നേറാം!"
    },

    "11-14": {
      priority: 45,
      emoji: "🎈",
      title: "Happy Children's Day!",
      message:
        "എല്ലാ കുഞ്ഞുങ്ങൾക്കും iTech IT Solutions-ന്റെ ഹൃദയം നിറഞ്ഞ ശിശുദിനാശംസകൾ!"
    },

    "11-19": {
      priority: 25,
      emoji: "👨",
      title: "International Men's Day",
      message:
        "എല്ലാവർക്കും International Men's Day ആശംസകൾ!"
    },

    "11-26": {
      priority: 50,
      emoji: "🇮🇳",
      title: "Constitution Day",
      message:
        "ഇന്ത്യൻ ഭരണഘടനയുടെ മഹത്വം ഓർമ്മിക്കുന്ന ദിനത്തിൽ ആശംസകൾ!"
    },

    "12-05": {
      priority: 25,
      emoji: "🌱",
      title: "World Soil Day",
      message:
        "മണ്ണിനെ സംരക്ഷിക്കാം, പ്രകൃതിയെ സംരക്ഷിക്കാം!"
    },

    "12-10": {
      priority: 30,
      emoji: "⚖️",
      title: "Human Rights Day",
      message:
        "എല്ലാവരുടെയും അവകാശങ്ങളും മാന്യതയും സംരക്ഷിക്കാം!"
    },

    "12-25": {
      priority: 100,
      emoji: "🎄",
      title: "Merry Christmas!",
      message:
        "iTech IT Solutions കുടുംബത്തിന്റെ ഹൃദയം നിറഞ്ഞ ക്രിസ്മസ് ആശംസകൾ!"
    },

    "12-31": {
      priority: 35,
      emoji: "🎆",
      title: "Happy New Year's Eve!",
      message:
        "പുതിയ പ്രതീക്ഷകളോടെ പുതിയൊരു വർഷത്തെ വരവേൽക്കാം!"
    }

  };


  /* =======================================================
     KERALA / REGIONAL DAYS
     2026 - 2030
     ======================================================= */

  const keralaDays = {

    2026: {

      "01-02": {
        priority: 60,
        emoji: "🌴",
        title: "Mannam Jayanthi",
        message:
          "മന്നത്ത് പത്മനാഭൻ ജയന്തി ആശംസകൾ!"
      },

      "04-14": {
        priority: 65,
        emoji: "🇮🇳",
        title: "Ambedkar Jayanti",
        message:
          "ഡോ. ബി. ആർ. അംബേദ്കർ ജയന്തി ആശംസകൾ!"
      },

      "04-15": {
        priority: 100,
        emoji: "🌼",
        title: "Happy Vishu!",
        message:
          "iTech IT Solutions കുടുംബത്തിന്റെ ഹൃദയം നിറഞ്ഞ വിഷു ആശംസകൾ!"
      },

      "08-17": {
        priority: 60,
        emoji: "🌴",
        title: "Chingam 1",
        message:
          "പുതിയ മലയാള വർഷാരംഭത്തിന്റെ ഹൃദയം നിറഞ്ഞ ആശംസകൾ!"
      },

      "08-26": {
        priority: 100,
        emoji: "🌸",
        title: "Happy Onam!",
        message:
          "iTech IT Solutions കുടുംബത്തിന്റെ ഹൃദയം നിറഞ്ഞ ഓണാശംസകൾ!"
      },

      "08-28": {
        priority: 55,
        emoji: "🌺",
        title: "Sree Narayana Guru Jayanti",
        message:
          "ശ്രീനാരായണ ഗുരു ജയന്തി ആശംസകൾ!"
      },

      "09-04": {
        priority: 55,
        emoji: "🪷",
        title: "Sree Krishna Jayanti",
        message:
          "ശ്രീകൃഷ്ണ ജയന്തി ആശംസകൾ!"
      },

      "10-20": {
        priority: 70,
        emoji: "🪔",
        title: "Mahanavami",
        message:
          "മഹാനവമി ആശംസകൾ!"
      },

      "10-21": {
        priority: 80,
        emoji: "🏹",
        title: "Vijayadashami",
        message:
          "വിജയദശമി ആശംസകൾ!"
      }

    },

    2027: {

      "01-02": {
        priority: 60,
        emoji: "🌴",
        title: "Mannam Jayanthi",
        message:
          "മന്നം ജയന്തി ആശംസകൾ!"
      },

      "04-14": {
        priority: 65,
        emoji: "🇮🇳",
        title: "Ambedkar Jayanti",
        message:
          "ഡോ. ബി. ആർ. അംബേദ്കർ ജയന്തി ആശംസകൾ!"
      },

      "04-15": {
        priority: 100,
        emoji: "🌼",
        title: "Happy Vishu!",
        message:
          "iTech IT Solutions കുടുംബത്തിന്റെ ഹൃദയം നിറഞ്ഞ വിഷു ആശംസകൾ!"
      },

      "08-18": {
        priority: 60,
        emoji: "🌴",
        title: "Chingam 1",
        message:
          "പുതിയ മലയാള വർഷാരംഭത്തിന്റെ ഹൃദയം നിറഞ്ഞ ആശംസകൾ!"
      },

      "09-12": {
        priority: 100,
        emoji: "🌸",
        title: "Happy Onam!",
        message:
          "iTech IT Solutions കുടുംബത്തിന്റെ ഹൃദയം നിറഞ്ഞ ഓണാശംസകൾ!"
      }

    },

    2028: {

      "04-14": {
        priority: 100,
        emoji: "🌼",
        title: "Happy Vishu!",
        message:
          "iTech IT Solutions കുടുംബത്തിന്റെ ഹൃദയം നിറഞ്ഞ വിഷു ആശംസകൾ!"
      },

      "08-17": {
        priority: 60,
        emoji: "🌴",
        title: "Chingam 1",
        message:
          "പുതിയ മലയാള വർഷാരംഭത്തിന്റെ ഹൃദയം നിറഞ്ഞ ആശംസകൾ!"
      },

      "09-01": {
        priority: 100,
        emoji: "🌸",
        title: "Happy Onam!",
        message:
          "iTech IT Solutions കുടുംബത്തിന്റെ ഹൃദയം നിറഞ്ഞ ഓണാശംസകൾ!"
      }

    },

    2029: {

      "04-14": {
        priority: 100,
        emoji: "🌼",
        title: "Happy Vishu!",
        message:
          "iTech IT Solutions കുടുംബത്തിന്റെ ഹൃദയം നിറഞ്ഞ വിഷു ആശംസകൾ!"
      },

      "08-17": {
        priority: 60,
        emoji: "🌴",
        title: "Chingam 1",
        message:
          "പുതിയ മലയാള വർഷാരംഭത്തിന്റെ ഹൃദയം നിറഞ്ഞ ആശംസകൾ!"
      },

      "08-22": {
        priority: 100,
        emoji: "🌸",
        title: "Happy Onam!",
        message:
          "iTech IT Solutions കുടുംബത്തിന്റെ ഹൃദയം നിറഞ്ഞ ഓണാശംസകൾ!"
      }

    },

    2030: {

      "04-15": {
        priority: 100,
        emoji: "🌼",
        title: "Happy Vishu!",
        message:
          "iTech IT Solutions കുടുംബത്തിന്റെ ഹൃദയം നിറഞ്ഞ വിഷു ആശംസകൾ!"
      },

      "08-17": {
        priority: 60,
        emoji: "🌴",
        title: "Chingam 1",
        message:
          "പുതിയ മലയാള വർഷാരംഭത്തിന്റെ ഹൃദയം നിറഞ്ഞ ആശംസകൾ!"
      },

      "09-09": {
        priority: 100,
        emoji: "🌸",
        title: "Happy Onam!",
        message:
          "iTech IT Solutions കുടുംബത്തിന്റെ ഹൃദയം നിറഞ്ഞ ഓണാശംസകൾ!"
      }

    }

  };


  /* =======================================================
     MOVABLE / YEAR-SPECIFIC FESTIVALS

     Dates that depend on lunar/calendar calculations are
     kept year-specific. Some Islamic dates can change after
     moon sighting.
     ======================================================= */

  const movableDays = {

    2026: {

      "03-20": {
        priority: 100,
        emoji: "🌙",
        title: "Eid Mubarak!",
        message:
          "iTech IT Solutions കുടുംബത്തിന്റെ ഹൃദയം നിറഞ്ഞ ഈദുൽ ഫിത്വർ ആശംസകൾ!",
        note: "Moon sighting may affect the date."
      },

      "05-27": {
        priority: 100,
        emoji: "🌙",
        title: "Eid Mubarak!",
        message:
          "ഈദുൽ അദ്ഹാ / ബലിപെരുന്നാൾ ആശംസകൾ!",
        note: "Moon sighting may affect the date."
      },

      "06-25": {
        priority: 70,
        emoji: "🌙",
        title: "Muharram",
        message:
          "മുഹറം ആശംസകൾ!",
        note: "Moon sighting may affect the date."
      },

      "08-25": {
        priority: 100,
        emoji: "🕌",
        title: "Eid Milad-un-Nabi",
        message:
          "ഈദുൽ മിലാദ് ആശംസകൾ!",
        note: "Moon sighting may affect the date."
      },

      "04-03": {
        priority: 90,
        emoji: "✝️",
        title: "Good Friday",
        message:
          "എല്ലാവർക്കും ദുഃഖവെള്ളി ആശംസകൾ!"
      },

      "04-05": {
        priority: 90,
        emoji: "✝️",
        title: "Happy Easter!",
        message:
          "iTech IT Solutions കുടുംബത്തിന്റെ ഹൃദയം നിറഞ്ഞ ഈസ്റ്റർ ആശംസകൾ!"
      },

      "11-08": {
        priority: 80,
        emoji: "🪔",
        title: "Happy Diwali!",
        message:
          "എല്ലാവർക്കും ദീപാവലി ആശംസകൾ!"
      },

      "11-24": {
        priority: 70,
        emoji: "🙏",
        title: "Guru Nanak Jayanti",
        message:
          "ഗുരു നാനാക് ജയന്തി ആശംസകൾ!"
      }

    },

    2027: {

      "03-10": {
        priority: 100,
        emoji: "🌙",
        title: "Eid Mubarak!",
        message:
          "ഈദുൽ ഫിത്വർ ആശംസകൾ!",
        note: "Tentative lunar date."
      },

      "05-17": {
        priority: 100,
        emoji: "🌙",
        title: "Eid Mubarak!",
        message:
          "ഈദുൽ അദ്ഹാ / ബലിപെരുന്നാൾ ആശംസകൾ!",
        note: "Tentative lunar date."
      },

      "06-05": {
        priority: 70,
        emoji: "🌙",
        title: "Muharram",
        message:
          "മുഹറം ആശംസകൾ!",
        note: "Tentative lunar date."
      },

      "08-15": {
        priority: 100,
        emoji: "🕌",
        title: "Eid Milad-un-Nabi",
        message:
          "ഈദുൽ മിലാദ് ആശംസകൾ!",
        note: "Tentative lunar date."
      },

      "03-26": {
        priority: 90,
        emoji: "✝️",
        title: "Good Friday",
        message:
          "എല്ലാവർക്കും ദുഃഖവെള്ളി ആശംസകൾ!"
      },

      "03-28": {
        priority: 90,
        emoji: "✝️",
        title: "Happy Easter!",
        message:
          "iTech IT Solutions കുടുംബത്തിന്റെ ഹൃദയം നിറഞ്ഞ ഈസ്റ്റർ ആശംസകൾ!"
      },

      "10-29": {
        priority: 80,
        emoji: "🪔",
        title: "Happy Diwali!",
        message:
          "എല്ലാവർക്കും ദീപാവലി ആശംസകൾ!"
      }

    },

    2028: {

      "02-27": {
        priority: 100,
        emoji: "🌙",
        title: "Eid Mubarak!",
        message:
          "ഈദുൽ ഫിത്വർ ആശംസകൾ!",
        note: "Tentative lunar date."
      },

      "05-06": {
        priority: 100,
        emoji: "🌙",
        title: "Eid Mubarak!",
        message:
          "ഈദുൽ അദ്ഹാ / ബലിപെരുന്നാൾ ആശംസകൾ!",
        note: "Tentative lunar date."
      },

      "05-25": {
        priority: 70,
        emoji: "🌙",
        title: "Muharram",
        message:
          "മുഹറം ആശംസകൾ!",
        note: "Tentative lunar date."
      },

      "08-04": {
        priority: 100,
        emoji: "🕌",
        title: "Eid Milad-un-Nabi",
        message:
          "ഈദുൽ മിലാദ് ആശംസകൾ!",
        note: "Tentative lunar date."
      },

      "04-14": {
        priority: 90,
        emoji: "✝️",
        title: "Good Friday",
        message:
          "എല്ലാവർക്കും ദുഃഖവെള്ളി ആശംസകൾ!"
      },

      "04-16": {
        priority: 90,
        emoji: "✝️",
        title: "Happy Easter!",
        message:
          "iTech IT Solutions കുടുംബത്തിന്റെ ഹൃദയം നിറഞ്ഞ ഈസ്റ്റർ ആശംസകൾ!"
      },

      "10-17": {
        priority: 80,
        emoji: "🪔",
        title: "Happy Diwali!",
        message:
          "എല്ലാവർക്കും ദീപാവലി ആശംസകൾ!"
      }

    },

    2029: {

      "02-15": {
        priority: 100,
        emoji: "🌙",
        title: "Eid Mubarak!",
        message:
          "ഈദുൽ ഫിത്വർ ആശംസകൾ!",
        note: "Tentative lunar date."
      },

      "04-25": {
        priority: 100,
        emoji: "🌙",
        title: "Eid Mubarak!",
        message:
          "ഈദുൽ അദ്ഹാ / ബലിപെരുന്നാൾ ആശംസകൾ!",
        note: "Tentative lunar date."
      },

      "05-14": {
        priority: 70,
        emoji: "🌙",
        title: "Muharram",
        message:
          "മുഹറം ആശംസകൾ!",
        note: "Tentative lunar date."
      },

      "07-24": {
        priority: 100,
        emoji: "🕌",
        title: "Eid Milad-un-Nabi",
        message:
          "ഈദുൽ മിലാദ് ആശംസകൾ!",
        note: "Tentative lunar date."
      },

      "03-30": {
        priority: 90,
        emoji: "✝️",
        title: "Good Friday",
        message:
          "എല്ലാവർക്കും ദുഃഖവെള്ളി ആശംസകൾ!"
      },

      "04-01": {
        priority: 90,
        emoji: "✝️",
        title: "Happy Easter!",
        message:
          "iTech IT Solutions കുടുംബത്തിന്റെ ഹൃദയം നിറഞ്ഞ ഈസ്റ്റർ ആശംസകൾ!"
      },

      "11-05": {
        priority: 80,
        emoji: "🪔",
        title: "Happy Diwali!",
        message:
          "എല്ലാവർക്കും ദീപാവലി ആശംസകൾ!"
      }

    },

    2030: {

      "02-05": {
        priority: 100,
        emoji: "🌙",
        title: "Eid Mubarak!",
        message:
          "ഈദുൽ ഫിത്വർ ആശംസകൾ!",
        note: "Tentative lunar date."
      },

      "04-14": {
        priority: 100,
        emoji: "🌙",
        title: "Eid Mubarak!",
        message:
          "ഈദുൽ അദ്ഹാ / ബലിപെരുന്നാൾ ആശംസകൾ!",
        note: "Tentative lunar date."
      },

      "05-03": {
        priority: 70,
        emoji: "🌙",
        title: "Muharram",
        message:
          "മുഹറം ആശംസകൾ!",
        note: "Tentative lunar date."
      },

      "07-13": {
        priority: 100,
        emoji: "🕌",
        title: "Eid Milad-un-Nabi",
        message:
          "ഈദുൽ മിലാദ് ആശംസകൾ!",
        note: "Tentative lunar date."
      },

      "04-19": {
        priority: 90,
        emoji: "✝️",
        title: "Good Friday",
        message:
          "എല്ലാവർക്കും ദുഃഖവെള്ളി ആശംസകൾ!"
      },

      "04-21": {
        priority: 90,
        emoji: "✝️",
        title: "Happy Easter!",
        message:
          "iTech IT Solutions കുടുംബത്തിന്റെ ഹൃദയം നിറഞ്ഞ ഈസ്റ്റർ ആശംസകൾ!"
      },

      "10-26": {
        priority: 80,
        emoji: "🪔",
        title: "Happy Diwali!",
        message:
          "എല്ലാവർക്കും ദീപാവലി ആശംസകൾ!"
      }

    }

  };


  /* =======================================================
     HELPERS
     ======================================================= */

  function getTodayKey() {

    const now = new Date();

    const year =
      now.getFullYear();

    const month =
      String(
        now.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        now.getDate()
      ).padStart(2, "0");

    return {
      year,
      key: `${month}-${day}`
    };

  }


  function getTodayWishes() {

    const today =
      getTodayKey();

    const results = [];

    if (
      annualDays[today.key]
    ) {

      results.push({
        ...annualDays[today.key],
        source: "annual"
      });

    }

    if (
      keralaDays[today.year] &&
      keralaDays[today.year][today.key]
    ) {

      results.push({
        ...keralaDays[today.year][today.key],
        source: "kerala"
      });

    }

    if (
      movableDays[today.year] &&
      movableDays[today.year][today.key]
    ) {

      results.push({
        ...movableDays[today.year][today.key],
        source: "festival"
      });

    }

    return results.sort(
      (a, b) =>
        (b.priority || 0) -
        (a.priority || 0)
    );

  }


  /* =======================================================
     CREATE STYLE
     ======================================================= */

  function addStyles() {

    const style =
      document.createElement(
        "style"
      );

    style.id =
      "itech-special-wishes-style";

    style.textContent = `

      .itech-wish-overlay {

        position: fixed;

        inset: 0;

        z-index: 999999;

        display: flex;

        align-items: center;

        justify-content: center;

        padding: 18px;

        background:
          rgba(4, 18, 42, .74);

        backdrop-filter:
          blur(8px);

        animation:
          itechWishFade
          .4s ease;

      }


      .itech-wish-card {

        position: relative;

        width:
          min(
            540px,
            100%
          );

        overflow: hidden;

        text-align: center;

        padding:
          38px
          24px
          28px;

        border-radius: 28px;

        background:
          linear-gradient(
            145deg,
            #ffffff,
            #f3f7fd
          );

        border:
          1px solid
          rgba(
            255,
            255,
            255,
            .9
          );

        box-shadow:
          0
          30px
          90px
          rgba(
            0,
            0,
            0,
            .35
          );

        animation:
          itechWishCard
          .55s
          cubic-bezier(
            .2,
            .8,
            .2,
            1
          );

      }


      .itech-wish-glow {

        position: absolute;

        width: 220px;

        height: 220px;

        border-radius: 50%;

        background:
          rgba(
            255,
            138,
            22,
            .13
          );

        filter:
          blur(8px);

        top: -110px;

        right: -80px;

      }


      .itech-wish-glow2 {

        position: absolute;

        width: 180px;

        height: 180px;

        border-radius: 50%;

        background:
          rgba(
            23,
            105,
            224,
            .10
          );

        filter:
          blur(8px);

        bottom: -100px;

        left: -70px;

      }


      .itech-wish-logo {

        position: relative;

        z-index: 2;

        width: 72px;

        height: 72px;

        object-fit: contain;

        margin-bottom: 12px;

      }


      .itech-wish-emoji {

        position: relative;

        z-index: 2;

        font-size: 52px;

        line-height: 1;

        margin-bottom: 14px;

        animation:
          itechWishFloat
          2s
          ease-in-out
          infinite;

      }


      .itech-wish-title {

        position: relative;

        z-index: 2;

        margin: 0;

        color:
          #071c3b;

        font-size:
          clamp(
            25px,
            6vw,
            40px
          );

        font-weight: 900;

        line-height: 1.2;

      }


      .itech-wish-message {

        position: relative;

        z-index: 2;

        margin:
          15px
          auto
          0;

        max-width: 450px;

        color:
          #566b88;

        font-size: 15px;

        line-height: 1.7;

      }


      .itech-wish-note {

        margin-top: 9px;

        font-size: 10px;

        color:
          #8998aa;

      }


      .itech-wish-brand {

        position: relative;

        z-index: 2;

        margin-top: 21px;

        padding-top: 12px;

        border-top:
          1px solid
          #e3eaf3;

        color:
          #071c3b;

        font-size: 12px;

        font-weight: 800;

      }


      .itech-wish-close {

        position: absolute;

        top: 12px;

        right: 12px;

        width: 37px;

        height: 37px;

        border: 0;

        border-radius: 50%;

        background:
          #edf2f8;

        color:
          #3d506a;

        font-size: 21px;

        line-height: 37px;

        cursor: pointer;

        z-index: 10;

      }


      .itech-wish-close:hover {

        background:
          #dfe7f2;

      }


      @keyframes itechWishFade {

        from {
          opacity: 0;
        }

        to {
          opacity: 1;
        }

      }


      @keyframes itechWishCard {

        from {

          opacity: 0;

          transform:
            translateY(35px)
            scale(.92);

        }

        to {

          opacity: 1;

          transform:
            translateY(0)
            scale(1);

        }

      }


      @keyframes itechWishFloat {

        0%,100% {

          transform:
            translateY(0);

        }

        50% {

          transform:
            translateY(-7px);

        }

      }


      @media(max-width:600px) {

        .itech-wish-overlay {

          padding: 12px;

        }


        .itech-wish-card {

          padding:
            32px
            17px
            24px;

          border-radius:
            22px;

        }


        .itech-wish-logo {

          width: 58px;

          height: 58px;

        }


        .itech-wish-emoji {

          font-size: 42px;

        }


        .itech-wish-title {

          font-size: 26px;

        }


        .itech-wish-message {

          font-size: 14px;

        }

      }

    `;

    document.head.appendChild(
      style
    );

  }


  /* =======================================================
     SHOW WISH
     ======================================================= */

  function showWish(wish) {

    addStyles();


    const overlay =
      document.createElement(
        "div"
      );

    overlay.className =
      "itech-wish-overlay";


    overlay.innerHTML = `

      <div
        class="itech-wish-card"
        role="dialog"
        aria-modal="true"
        aria-label="Special Day Greeting"
      >

        <div
          class="itech-wish-glow">
        </div>

        <div
          class="itech-wish-glow2">
        </div>


        <button
          class="itech-wish-close"
          type="button"
          aria-label="Close"
        >
          ×
        </button>


        <img
          class="itech-wish-logo"
          src="/assets/itech-logo.png"
          alt="iTech IT Solutions"
        >


        <div
          class="itech-wish-emoji"
        >
          ${wish.emoji}
        </div>


        <h2
          class="itech-wish-title"
        >
          ${wish.title}
        </h2>


        <p
          class="itech-wish-message"
        >
          ${wish.message}
        </p>


        ${
          wish.note
          ? `
            <div
              class="itech-wish-note"
            >
              ${wish.note}
            </div>
          `
          : ""
        }


        <div
          class="itech-wish-brand"
        >
          iTech IT Solutions
          · Nedumangad
        </div>

      </div>

    `;


    document.body.appendChild(
      overlay
    );


    function closeWish() {

      overlay.style.opacity =
        "0";

      overlay.style.transition =
        "opacity .3s ease";

      setTimeout(
        () => {

          overlay.remove();

        },
        300
      );

    }


    overlay
      .querySelector(
        ".itech-wish-close"
      )
      .addEventListener(
        "click",
        closeWish
      );


    overlay.addEventListener(
      "click",
      function (event) {

        if (
          event.target ===
          overlay
        ) {

          closeWish();

        }

      }
    );


    setTimeout(
      closeWish,
      SETTINGS.autoCloseMs
    );

  }


  /* =======================================================
     START
     ======================================================= */

  function start() {

    const wishes =
      getTodayWishes();


    if (!wishes.length) {

      return;

    }


    const today =
      getTodayKey();


    const storageKey =
      `itech-wish-${today.year}-${today.key}`;


    if (
      SETTINGS.showOncePerDay &&
      SETTINGS.rememberShown &&
      localStorage.getItem(
        storageKey
      )
    ) {

      return;

    }


    /* Mark as shown */

    if (
      SETTINGS.showOncePerDay &&
      SETTINGS.rememberShown
    ) {

      localStorage.setItem(
        storageKey,
        "1"
      );

    }


    /*
      If multiple occasions fall on
      the same day, highest priority
      occasion is displayed.
    */

    showWish(
      wishes[0]
    );

  }


  /* =======================================================
     WAIT FOR PAGE
     ======================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      start
    );

  } else {

    start();

  }

})();
