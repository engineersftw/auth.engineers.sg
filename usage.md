# Usage Guide

- [For Oauth Apps](#for-oauth-apps)
- [For microservices](#for-microservices)

## For Oauth Apps

### Getting a User Access Token (Authorization Token Grant)

1. Request for an Oauth2 App. You will be issued a `client_id` and `client_secret`. Do define your `redirect_uri` where we will send you the `authorization_code`.

2. Get user permission:

    - Redirect your users to the following address:

        ```
        https://auth.engineers.sg/auth
          ?client_id=XXXXX
          &redirect_uri=https%3A%2F%2Fexample-app.com%2Fcallback
          &scope=default
          &state=XXXXXX
        ```
    - The query parameters:
        - `client_id` (required) - The public identifier for your application.
        - `redirect_uri` (required) - Tells the authorization server where to send the user back to after they approve the request. This should be the same as what you provided in step 1.
        - `scope` (optional) - One or more space-separated strings indicating which permissions the application is requesting. Default: `default`.
        - `state` (optional) - The application generates a random string and includes it in the request. It should then check that the same value is returned after the user authorizes the app. This is used to prevent CSRF attacks.

3. After the user logs in to Auth.engineers.sg and gives permission, they will be redirected back to your callback URL (or `redirect_uri`) with the Authorization Code in the `code` query argument.

    ```
    https://example-app.com/callback
      ?code=XXXXXXXX
      &state=XXXXXXX
    ```
    
4. Exchange your Authorization Token for the `access_token`. This will be a [JWT](https://jwt.io) token.

    Do a JSON POST to this URL:

    ```
    https://auth.engineers.sg/auth/token
    ```
    
    With this JSON payload:

    ```json
    {
      "code": "XXXXXXXX",
      "client_id": "XXXXXXXX",
      "client_secret": "XXXXXXXX",
      "redirect_uri": "https://example-app.com/callback"
    }
    ```
    
    You will receive this JSON response:
    
    ```json
    {
      "access_token":"XXXXXXXX.XXXXXXXX.XXXXXXXX",
      "token_type":"bearer",
      "expires_in":3600,
      "scope":"default"
    }
    ```

---

### For Single Page Apps

Use the [Proof Key for Code Exchange](https://oauth.net/2/pkce/) to exchange your token. This is similar to the Oauth 2 Authorization Token Grant with these differences:

#### Step 2: Get user permission:

- Redirect your users to the following address:

    ```
    https://auth.engineers.sg/auth
      ?client_id=XXXXX
      &redirect_uri=https%3A%2F%2Fexample-app.com%2Fcallback
      &code_challenge=XXXXXXXX
      &scope=default
      &state=XXXXXX
    ```
- The query parameters:
    - `client_id` (required) - The public identifier for your application.
    - `redirect_uri` (required) - Tells the authorization server where to send the user back to after they approve the request. This should be the same as what you provided in step 1.
    - `code_challenge` (required) - The code challenge string (or code verifier) This is a cryptographically random string using the characters A-Z, a-z, 0-9, and the punctuation characters -._~ (hyphen, period, underscore, and tilde), between 43 and 128 characters long.
    - `scope` (optional) - One or more space-separated strings indicating which permissions the application is requesting. Default: `default`.
    - `state` (optional) - The application generates a random string and includes it in the request. It should then check that the same value is returned after the user authorizes the app. This is used to prevent CSRF attacks.

#### Step 4: Exchange for Access Token

Exchange your Authorization Token for the `access_token`. This will be a [JWT](https://jwt.io) token.

Do a JSON POST to this URL:

```
https://auth.engineers.sg/auth/token
```
    
With this JSON payload:

```json
{
  "code": "XXXXXXXX",
  "client_id": "XXXXXXXX",
  "code_verifier": "XXXXXXXX",
  "redirect_uri": "https://example-app.com/callback"
}
```

The `code_verifier` should be the same as the `code_challenge` used in step 2.
    
You will receive this JSON response:
    
```json
{
  "access_token":"XXXXXXXX.XXXXXXXX.XXXXXXXX",
  "token_type":"bearer",
  "expires_in":3600,
  "scope":"default"
}
```

## For microservices

To be confirmed