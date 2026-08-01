//! Lookout core — policy + tool names. Phase 1 network path lives in TS; Rust owns SSRF pure tests and future port.

pub const ENGINE_NAME: &str = "lookout-core";
pub const ENGINE_VERSION: &str = "0.1.0";

pub const CORE_TOOLS: &[&str] = &["web_search", "web_fetch", "web_extract"];
pub const ADVANCED_TOOLS: &[&str] = &["web_cache", "web_crawl", "web_research"];

pub fn is_blocked_hostname(host: &str) -> bool {
    let h = host.trim_matches(|c| c == '[' || c == ']').to_ascii_lowercase();
    h == "localhost"
        || h == "metadata"
        || h == "metadata.google.internal"
        || h.ends_with(".localhost")
        || h.ends_with(".local")
}

pub fn is_blocked_ipv4(host: &str) -> bool {
    let parts: Vec<u8> = match host
        .split('.')
        .map(|p| p.parse::<u8>())
        .collect::<Result<Vec<_>, _>>()
    {
        Ok(p) if p.len() == 4 => p,
        _ => return false,
    };
    let (a, b) = (parts[0], parts[1]);
    a == 0
        || a == 10
        || a == 127
        || (a == 169 && b == 254)
        || (a == 172 && (16..=31).contains(&b))
        || (a == 192 && b == 168)
        || (a == 100 && (64..=127).contains(&b))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn core_tools_are_clear_and_separate() {
        assert_eq!(CORE_TOOLS.len(), 3);
        assert_eq!(ADVANCED_TOOLS.len(), 3);
    }

    #[test]
    fn blocks_private_and_metadata_hosts() {
        assert!(is_blocked_hostname("localhost"));
        assert!(is_blocked_ipv4("127.0.0.1"));
        assert!(is_blocked_ipv4("10.1.2.3"));
        assert!(is_blocked_ipv4("169.254.169.254"));
        assert!(!is_blocked_ipv4("1.1.1.1"));
    }
}
