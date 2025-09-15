### Project Title: Branch.io API Domain Proxy

This Node.js Express application functions as a robust domain proxy for the Branch.io API. It allows applications to circumvent common issues, such as **Ad Blockers on Android devices** that might prevent direct calls to `https://api2.branch.io/`.

By routing all Branch.io API traffic through your application's own domain, this service enables seamless interaction with Branch.io's features, even when users have strict ad-blocking software enabled.

**Why use this proxy?**

*   **Ad Blocker Circumvention:** Many ad blockers specifically target known tracking and analytics domains, including Branch.io's API endpoints. By proxying requests through your application's first-party s all user devices, including those with aggressive ad-blocking configurations.
*   **Centralized Control:** Provides a single, controlled entry point for all Branch.io API interactions, allowing for centralized logging, monitoring, and potential future enhancements like custom authentication, rate limiting, or data transformation before requests reach Branch.io.
*   **Security Layer:** Includes built-in validation for `branch_key` values, ensuring that only pre-approved API keys (managed via environment variables) can utilize the proxy service.

**Key Features:**
*   **Dynamic Routing:** Automatically forwards any API path after the root to the Branch.io API.
*   **Method Agnostic:** Supports all HTTP methods (GET, POST, PUT, DELETE) for seamless integration.
*   **Payload Forwarding:** Transmits original request bodies (for POST/PUT) and query parameters (for GET) directly to Branch.io.
*   **Header Management:** Carefully forwards relevant HTTP headers while filtering out those specific to the proxy connection.
*   **Response Handling:** Captures responses from Branch.io, including status codes and data, and returns them to the originating client.


For the `FlutterBranchSDK` plugin, configure the Url in the `branch-config.jso`n file under the **apiUrl** key