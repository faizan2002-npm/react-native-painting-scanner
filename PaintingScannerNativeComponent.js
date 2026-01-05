/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {TurboModule} from '../src/NativePaintingScanner';
import {TurboModuleRegistry} from 'react-native';

export default (TurboModuleRegistry.getEnforcing<TurboModule>(
  'PaintingScanner',
): TurboModule);

