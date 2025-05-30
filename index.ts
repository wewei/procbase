export type Procedure<Input, Output> = (input: Input) => Output;
export type AsyncProcedure<Input, Output> = Procedure<Input, Promise<Output>>;
export type ProcedureKey = string;

export type SearchResultItem = {
  key: ProcedureKey;
  description: string;
  relavence: number;
};

export type SearchResult = {
  items: SearchResultItem[];
  query: string;
};

export type Procbase = {
  search: (query: string) => Promise<SearchResult>;
  write: (code: string) => Promise<ProcedureKey>;
  read: (key: ProcedureKey) => Promise<string>;
}

export const makeProcbase = (path: string) => {

}