export type SemanticSearchResult = {
  key: string; // 唯一标识符
  relevance: number; // 相关性评分，范围为0到1
};

export type SemanticSearchQuery<Embedding> = {
  embedding: Embedding;
  maxResults?: number; // 可选参数，限制返回结果数量
  minRelevance?: number; // 可选参数，过滤低相关性的结果
};

export type SemanticIndex<Embedding> = {
  search(query: SemanticSearchQuery<Embedding>): Promise<SemanticSearchResult[]>;
  set(embedding: Embedding, key: string): Promise<void>;
  del(value: string): Promise<void>;
};

export type EntryStore<Entry> = {
  set(key: string, entry: Entry): Promise<void>;
  get(key: string): Promise<Entry | null>;
  del(key: string): Promise<void>;
};

export type SemanticDB<Embedding, Entry extends Record<string, any>> = {
  setEntry(key: string, entry: Entry): Promise<void>;
  getEntry(key: string): Promise<Entry | null>;
  delEntry(key: string): Promise<void>;
  search(query: SemanticSearchQuery<Embedding>): Promise<SemanticSearchResult[]>;
};

export const makeSemanticDB = async <Embedding, Entry extends Record<string, any>>({
  makeSemanticIndex,
  makeEntryStore,
  embedEntry,
}:{
  makeSemanticIndex: () => Promise<SemanticIndex<Embedding>>,
  makeEntryStore: () => Promise<EntryStore<Entry>>,
  embedEntry: (entry: Entry) => Promise<Embedding>,
}): Promise<SemanticDB<Embedding, Entry>> => {
  const index = await makeSemanticIndex();
  const entryStore = await makeEntryStore();

  const setEntry = async (key: string, entry: Entry): Promise<void> => {
    await entryStore.set(key, entry);
    await index.set(await embedEntry(entry), key);
  };

  const getEntry = async (key: string): Promise<Entry | null> => {
    return await entryStore.get(key);
  };

  const delEntry = async (key: string): Promise<void> => {
    await Promise.all([entryStore.del(key), index.del(key)]);
  };

  const search = async (query: SemanticSearchQuery<Embedding>): Promise<SemanticSearchResult[]> => {
    return await index.search(query);
  };

  return {
    setEntry,
    getEntry,
    delEntry,
    search,
  };
};

// export type Entry = {
//   decription: string;
//   type: 'type' | 'value' | 'function' | 'class' | 'interface' | 'enum';
//   subtype?: string; // 可选的子类型，用于更细粒度的分类
//   exportName: string;
//   moduleId: string;
// };
