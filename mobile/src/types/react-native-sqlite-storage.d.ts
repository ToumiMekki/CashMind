declare module 'react-native-sqlite-storage' {
  export interface ResultSet {
    rows: {
      length: number;
      item(i: number): Record<string, unknown>;
    };
  }

  export interface SQLiteDatabase {
    executeSql(
      sql: string,
      params?: unknown[]
    ): Promise<[ResultSet]>;
    close(): Promise<void>;
  }

  const SQLite: {
    openDatabase(config: {
      name: string;
      location?: string;
    }): Promise<SQLiteDatabase>;
    enablePromise(enable: boolean): void;
    DEBUG(debug: boolean): void;
  };

  export default SQLite;
}
