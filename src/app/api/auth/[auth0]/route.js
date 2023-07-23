import { handleAuth, handleCallback } from '@auth0/nextjs-auth0';

export const GET = handleAuth();

// export default handleAuth({
//     callback: async (req, res) => {
//       try {
//         await handleCallback(req, res, {
//           redirectUri: 'https://example.com'
//         });
//       } catch (error) {
//         console.error(error);
//       }
//     }
//   });