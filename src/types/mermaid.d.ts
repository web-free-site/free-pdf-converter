declare module 'mermaid' {
  const mermaid: {
    initialize: (config: Record<string, unknown>) => void;
    run: (options?: Record<string, unknown>) => Promise<void>;
    render: (
      id: string,
      text: string
    ) => Promise<{ svg: string; bindFunctions?: () => void }>;
  };
  export default mermaid;
}
