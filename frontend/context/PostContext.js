import React, { createContext, useState } from "react";

export const PostContext = createContext();

export function PostProvider({ children }) {
  const [refreshFlag, setRefreshFlag] = useState(0);

  const triggerRefresh = () => setRefreshFlag((prev) => prev + 1);

  return (
    <PostContext.Provider value={{ refreshFlag, triggerRefresh }}>
      {children}
    </PostContext.Provider>
  );
}
