/*
███████╗██╗███╗   ██╗ ██████╗ ███████╗██████╗     ██╗    ██╗███████╗ ██████╗ 
██╔════╝██║████╗  ██║██╔════╝ ██╔════╝██╔══██╗    ██║    ██║██╔════╝██╔════╝ 
█████╗  ██║██╔██╗ ██║██║  ███╗█████╗  ██████╔╝    ██║ █╗ ██║█████╗  ██║  ███╗
██╔══╝  ██║██║╚██╗██║██║   ██║██╔══╝  ██╔══██╗    ██║███╗██║██╔══╝  ██║   ██║
██║     ██║██║ ╚████║╚██████╔╝███████╗██║  ██║    ╚███╔███╔╝███████╗╚██████╔╝
╚═╝     ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝     ╚══╝╚══╝ ╚══════╝ ╚═════╝ 
*/

const BASE_URL = `${window.location.origin}/${window.location.pathname.split('/').filter((e, i)=>{return i>0 & i<4}).join('/')}`;
const ON = true;
const OFF = false;
const EMPTY_LINK = "javascript:undefined";
const DEFAULT = {
  social: {
    twitter: {
      icon: `${BASE_URL}/assets/images/twitter.png`,
      profile: "https://twitter.com/InnolabM4"
    },
    facebook: {
      icon: `${BASE_URL}/assets/images/facebook.png`,
      profile: "https://www.facebook.com/HfTStuttgart"
    },
    linkedin: {
      icon: `${BASE_URL}/assets/images/linkedin.png`,
      profile: "https://www.linkedin.com/school/hochschule-f%C3%BCr-technik-stuttgart-%E2%80%93-university-of-applied-sciences"
    },
    webpage: {
      icon: `${BASE_URL}/assets/images/webpage.png`,
      profile: "https://www.hft-stuttgart.de"
    }
  },
  avatar: `${BASE_URL}/assets/images/avatar.png`
};

/*
███████╗███████╗████████╗████████╗██╗███╗   ██╗ ██████╗ ███████╗
██╔════╝██╔════╝╚══██╔══╝╚══██╔══╝██║████╗  ██║██╔════╝ ██╔════╝
███████╗█████╗     ██║      ██║   ██║██╔██╗ ██║██║  ███╗███████╗
╚════██║██╔══╝     ██║      ██║   ██║██║╚██╗██║██║   ██║╚════██║
███████║███████╗   ██║      ██║   ██║██║ ╚████║╚██████╔╝███████║
╚══════╝╚══════╝   ╚═╝      ╚═╝   ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝
*/

let settings = {

  switches: [
    {
      name: "projectLogo",
      state: ON
    },
    {
      name: "projectName",
      state: ON
    },
    {
      name: "menu",
      state: ON
    },
    {
      name: "participants",
      state: ON
    },
    {
      name: "footerLogos",
      state: ON
    }
  ],

  projectLogo: `${BASE_URL}/assets/logos/M4_LAB_tr.png`,

  projectName: "M4_LAB Page Demo",

  menu: [
    {
      menuText: "home",
      link: `${BASE_URL}/home/`
    },
    {
      menuText: "results",
      link: `${BASE_URL}/results/`
    },
    {
      menuText: "demo",
      link: "http://example.com"
    }
  ],

  participants: [
    {
      name: "John Doe",
      avatar: DEFAULT.avatar,
      email: "john.doe@lalaland.com",
      social: [
        {
          agent: "twitter",
          icon: DEFAULT.social.twitter.icon,
          profile: DEFAULT.social.twitter.profile
        },
        {
          agent: "facebook",
          icon: DEFAULT.social.facebook.icon,
          profile: DEFAULT.social.facebook.profile
        },
        {
          agent: "linkedin",
          icon: DEFAULT.social.linkedin.icon,
          profile: DEFAULT.social.linkedin.profile
        },
        {
          agent: "webpage",
          icon: DEFAULT.social.webpage.icon,
          profile: "https://johndoe.com"
        }
      ]
    },
    {
      name: "Charlotte Doe",
      avatar: `${BASE_URL}/assets/images/charlotte.jpg`,
      email: "charlotte.doe@lalaland.com",
      social: [
        {
          agent: "twitter",
          icon: DEFAULT.social.twitter.icon,
          profile: DEFAULT.social.twitter.profile
        },
        {
          agent: "facebook",
          icon: DEFAULT.social.facebook.icon,
          profile: DEFAULT.social.facebook.profile
        },
        {
          agent: "linkedin",
          icon: DEFAULT.social.linkedin.icon,
          profile: DEFAULT.social.linkedin.profile
        }
      ]
    }
  ],

  footerLogos: [
    {
      logo: `${BASE_URL}/assets/logos/Logo_M4_LAB.jpg`,
      href: EMPTY_LINK,
      title: "M4_LAB"
    },
    {
      logo: `${BASE_URL}/assets/logos/logo1.png`,
      href: "http://www.innovative-hochschule.de",
      title: "Innovative Hochschule"
    },
    {
      logo: `${BASE_URL}/assets/logos/logo2.png`,
      href: "https://www.bmbf.de",
      title: "Bundesministerium für Bildung und Forschung"
    },
    {
      logo: `${BASE_URL}/assets/logos/logo3.png`,
      href: "https://www.gwk-bonn.de",
      title: "Die Gemeinsame Wissenschaftskonferenz"
    }
  ]
};