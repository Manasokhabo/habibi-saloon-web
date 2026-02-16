// Deprecated: Switching back to Firebase for cloud persistence as requested.
export const localDataService = {
  getCurrentUser: () => null,
  logout: () => {},
  signIn: () => { throw new Error("Use Firebase Service"); },
  signUp: () => { throw new Error("Use Firebase Service"); },
  addBooking: () => { throw new Error("Use Firebase Service"); }
};