export const displayRedHD = (text) => text.replace(/♦|♥/g, (match) => {
    return `<span class="text-red-600">${match}</span>`;
  });