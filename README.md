# Welcome to your Dyad app

## Supabase Storage

Uploaded files are stored in the `BarberTor` bucket on Supabase Storage.

Use the helper functions to upload files and get their public URLs:

```ts
import { uploadFile, getPublicUrl } from '@/integrations/supabase/storage';

const path = `example/${file.name}`;
await uploadFile('BarberTor', path, file);
const publicUrl = getPublicUrl('BarberTor', path);
```
