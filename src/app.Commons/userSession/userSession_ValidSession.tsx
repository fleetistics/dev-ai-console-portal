import React from 'react';

export type UserSessionInfo = {
  userId: number;
  sessionId: number;
};

export const UserSessionContext = React.createContext<UserSessionInfo>({
  userId: -1,
  sessionId: -1,
});
export function UserSession_ValidSession(props: {
  userId: number;
  sessionId: number;
  children: React.ReactNode;
}) {
  return (
    <UserSessionContext.Provider
      value={{
        userId: props.userId,
        sessionId: props.sessionId,
      }}
    >
      {props.children}
    </UserSessionContext.Provider>
  );
}
export const useUserSession = () => React.useContext(UserSessionContext);
