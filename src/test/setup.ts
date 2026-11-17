import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(cleanup);
// App-level tests also load route chunks before their mocked API reads resolve.
configure({ asyncUtilTimeout: 3000 });
