# Environment Variables Setup

The application requires a `.env.local` file with the following environment variables:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# Azure AD Configuration
AZURE_AD_CLIENT_ID=your-azure-client-id
AZURE_AD_CLIENT_SECRET=your-azure-client-secret
AZURE_AD_TENANT_ID=your-azure-tenant-id

# OpenAI API Configuration
OPENAI_API_KEY=your-openai-api-key
```

## Steps to create the .env.local file:

1. Create a new file named `.env.local` in the root directory of this project
2. Copy the above template into the file
3. Replace the placeholder values with your actual credentials:
   - Replace `<username>`, `<password>`, `<cluster>`, and `<database>` in the MongoDB URI
   - Generate a secure random string for `NEXTAUTH_SECRET` (you can use `openssl rand -base64 32` in terminal)
   - Add your Azure AD client ID, client secret, and tenant ID from your Azure portal
   - Add your OpenAI API key from your OpenAI dashboard

Note: The `.env.local` file is ignored by git for security reasons, so you'll need to set up this file on each development environment. 