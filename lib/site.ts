// Global site configuration — nav links, footer details, contact.
// Edit here to change site-wide chrome.

export const site = {
  name: "14x9",
  established: "est 2015",
  location: "Brooklyn, New York",
  email: "hello@14x9.com",
  nav: [
    { label: "Work", href: "/" },
    { label: "About", href: "/about" },
  ],
  social: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/naimsheriff/" },
    { label: "Instagram", href: "https://www.instagram.com/naimsheriff" },
  ],
} as const;
