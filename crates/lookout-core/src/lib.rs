//! Lookout core scaffold — Phase 1 will own search adapters, fetch policy (SSRF), extract, cache.

pub const ENGINE_NAME: &str = "lookout-core";
pub const ENGINE_VERSION: &str = "0.0.0";

/// Placeholder tool names for the public surface.
pub const CORE_TOOLS: &[&str] = &["web_search", "web_fetch", "web_extract", "web_cache"];

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn core_tools_are_clear_and_separate() {
        assert_eq!(CORE_TOOLS.len(), 4);
        assert!(CORE_TOOLS.contains(&"web_search"));
        assert!(CORE_TOOLS.contains(&"web_fetch"));
    }
}
