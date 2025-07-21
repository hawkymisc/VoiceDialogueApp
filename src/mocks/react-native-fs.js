// Mock for react-native-fs in web environment

export const DocumentDirectoryPath = '/mock/documents';
export const DownloadDirectoryPath = '/mock/downloads';
export const ExternalDirectoryPath = '/mock/external';
export const ExternalStorageDirectoryPath = '/mock/external-storage';
export const TemporaryDirectoryPath = '/mock/tmp';
export const LibraryDirectoryPath = '/mock/library';
export const PicturesDirectoryPath = '/mock/pictures';

export const readFile = (path, encoding = 'utf8') => {
  console.warn('react-native-fs readFile called in web environment:', path);
  return Promise.resolve('mock file content');
};

export const writeFile = (path, contents, encoding = 'utf8') => {
  console.warn('react-native-fs writeFile called in web environment:', path);
  return Promise.resolve();
};

export const exists = (path) => {
  console.warn('react-native-fs exists called in web environment:', path);
  return Promise.resolve(false);
};

export const mkdir = (path, options = {}) => {
  console.warn('react-native-fs mkdir called in web environment:', path);
  return Promise.resolve();
};

export const unlink = (path) => {
  console.warn('react-native-fs unlink called in web environment:', path);
  return Promise.resolve();
};

export const readDir = (path) => {
  console.warn('react-native-fs readDir called in web environment:', path);
  return Promise.resolve([]);
};

export default {
  DocumentDirectoryPath,
  DownloadDirectoryPath,
  ExternalDirectoryPath,
  ExternalStorageDirectoryPath,
  TemporaryDirectoryPath,
  LibraryDirectoryPath,
  PicturesDirectoryPath,
  readFile,
  writeFile,
  exists,
  mkdir,
  unlink,
  readDir
};