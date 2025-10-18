#!/usr/bin/env python3
"""
API Endpoints 测试脚本
测试 AI Core 和 Data Connector 服务的所有 endpoints
"""

import requests
import json
import time
import sys
from typing import Dict, Any, Optional
from colorama import init, Fore, Style

# 初始化 colorama
init(autoreset=True)

# 配置
AI_CORE_URL = "http://localhost:8000"
DATA_CONNECTOR_URL = "http://localhost:8001"
AUTH_TOKEN = ""

# 统计
success_count = 0
fail_count = 0
total_tests = 0


def print_header(text: str):
    """打印标题"""
    print(f"\n{Fore.CYAN}{'=' * 64}")
    print(f"{Fore.CYAN}  {text}")
    print(f"{Fore.CYAN}{'=' * 64}")


def test_endpoint(
    name: str,
    url: str,
    method: str = "GET",
    body: Optional[Dict[str, Any]] = None,
    headers: Optional[Dict[str, str]] = None
) -> bool:
    """测试单个端点"""
    global success_count, fail_count, total_tests
    total_tests += 1
    
    print(f"\n{Fore.YELLOW}[{total_tests}] Testing: {name}")
    print(f"    URL: {url}")
    print(f"    Method: {method}")
    
    try:
        # 准备headers
        req_headers = {"Content-Type": "application/json"}
        if headers:
            req_headers.update(headers)
        
        # 打印请求体
        if body:
            print(f"    Body: {json.dumps(body, ensure_ascii=False)[:200]}...")
        
        # 发送请求
        start_time = time.time()
        
        if method == "GET":
            response = requests.get(url, headers=req_headers, timeout=30)
        elif method == "POST":
            response = requests.post(url, headers=req_headers, json=body, timeout=30)
        elif method == "PUT":
            response = requests.put(url, headers=req_headers, json=body, timeout=30)
        elif method == "DELETE":
            response = requests.delete(url, headers=req_headers, timeout=30)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        end_time = time.time()
        duration = (end_time - start_time) * 1000  # ms
        
        # 检查响应
        response.raise_for_status()
        
        print(f"{Fore.GREEN}    ✓ PASSED ({duration:.2f}ms)")
        
        # 打印响应（限制长度）
        response_text = response.text[:200]
        print(f"    Response: {response_text}...")
        
        success_count += 1
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"{Fore.RED}    ✗ FAILED")
        print(f"{Fore.RED}    Error: {str(e)}")
        
        if hasattr(e, 'response') and e.response is not None:
            print(f"{Fore.RED}    Status Code: {e.response.status_code}")
            try:
                error_detail = e.response.json()
                print(f"{Fore.RED}    Detail: {error_detail}")
            except:
                pass
        
        fail_count += 1
        return False


def main():
    """主函数"""
    print(f"{Fore.CYAN}")
    print("=" * 64)
    print("  AI Business Platform - API Endpoints Test Suite")
    print("=" * 64)
    print(Style.RESET_ALL)
    
    print("\nConfiguration:")
    print(f"  AI Core URL: {AI_CORE_URL}")
    print(f"  Data Connector URL: {DATA_CONNECTOR_URL}")
    print(f"  Using Auth Token: {'Yes' if AUTH_TOKEN else 'No'}")
    
    auth_headers = {}
    if AUTH_TOKEN:
        auth_headers["Authorization"] = f"Bearer {AUTH_TOKEN}"
    
    # ============================================================
    # AI CORE SERVICE TESTS
    # ============================================================
    
    print_header("AI CORE SERVICE TESTS")
    
    # Health Check
    test_endpoint(
        "AI Core - Health Check",
        f"{AI_CORE_URL}/health",
        "GET"
    )
    
    # Embeddings Collection List
    test_endpoint(
        "AI Core - List Embeddings Collections",
        f"{AI_CORE_URL}/api/v1/embeddings/collections",
        "GET",
        headers=auth_headers
    )
    
    # Embeddings Upsert
    test_endpoint(
        "AI Core - Upsert Embeddings",
        f"{AI_CORE_URL}/api/v1/embeddings/upsert",
        "POST",
        body={
            "collection": "test_collection",
            "documents": [
                {
                    "id": "doc1",
                    "content": "這是測試文件",
                    "metadata": {"source": "test"}
                }
            ]
        },
        headers=auth_headers
    )
    
    # Embeddings Search
    test_endpoint(
        "AI Core - Search Embeddings",
        f"{AI_CORE_URL}/api/v1/embeddings/search",
        "POST",
        body={
            "collection": "test_collection",
            "query": "測試",
            "limit": 5
        },
        headers=auth_headers
    )
    
    # NLP Generate
    test_endpoint(
        "AI Core - Generate Text",
        f"{AI_CORE_URL}/api/v1/nlp/generate",
        "POST",
        body={
            "prompt": "你好，請介紹一下台灣",
            "max_tokens": 100,
            "temperature": 0.7,
            "model": "gpt-3.5-turbo"
        },
        headers=auth_headers
    )
    
    # NLP Chat
    test_endpoint(
        "AI Core - Chat",
        f"{AI_CORE_URL}/api/v1/nlp/chat",
        "POST",
        body={
            "messages": [
                {"role": "user", "content": "你好"}
            ],
            "max_tokens": 50
        },
        headers=auth_headers
    )
    
    # NLP Summarize
    test_endpoint(
        "AI Core - Summarize Text",
        f"{AI_CORE_URL}/api/v1/nlp/summarize",
        "POST",
        body={
            "text": "人工智能（Artificial Intelligence，AI）是計算機科學的一個分支，致力於創建能夠執行通常需要人類智能的任務的系統。",
            "max_length": 50
        },
        headers=auth_headers
    )
    
    # NLP Translate
    test_endpoint(
        "AI Core - Translate Text",
        f"{AI_CORE_URL}/api/v1/nlp/translate",
        "POST",
        body={
            "text": "Hello, how are you?",
            "target_language": "zh-TW"
        },
        headers=auth_headers
    )
    
    # Vision Analyze
    test_endpoint(
        "AI Core - Analyze Image",
        f"{AI_CORE_URL}/api/v1/vision/analyze",
        "POST",
        body={
            "image_base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            "prompt": "Describe this image"
        },
        headers=auth_headers
    )
    
    # Module Registry
    test_endpoint(
        "AI Core - List Module Registry",
        f"{AI_CORE_URL}/api/v1/modules/registry",
        "GET",
        headers=auth_headers
    )
    
    # Module by Industry
    test_endpoint(
        "AI Core - Get Modules by Industry",
        f"{AI_CORE_URL}/api/v1/modules/by-industry/manufacturing",
        "GET",
        headers=auth_headers
    )
    
    # ============================================================
    # DATA CONNECTOR SERVICE TESTS
    # ============================================================
    
    print_header("DATA CONNECTOR SERVICE TESTS")
    
    # Health Check
    test_endpoint(
        "Data Connector - Health Check",
        f"{DATA_CONNECTOR_URL}/health",
        "GET"
    )
    
    # Connection Health Check
    test_endpoint(
        "Data Connector - Connection Health",
        f"{DATA_CONNECTOR_URL}/api/v1/connectors/connections/health/check",
        "GET",
        headers=auth_headers
    )
    
    # List Connections
    test_endpoint(
        "Data Connector - List Connections",
        f"{DATA_CONNECTOR_URL}/api/v1/connectors/connections/",
        "GET",
        headers=auth_headers
    )
    
    # Test Connection
    test_endpoint(
        "Data Connector - Test Connection",
        f"{DATA_CONNECTOR_URL}/api/v1/connectors/connections/test",
        "POST",
        body={
            "type": "Excel",
            "config": {
                "uploaded": True,
                "rows": 100
            }
        },
        headers=auth_headers
    )
    
    # POS Health
    test_endpoint(
        "Data Connector - POS Health",
        f"{DATA_CONNECTOR_URL}/api/v1/connectors/pos/health",
        "GET"
    )
    
    # Upload Health
    test_endpoint(
        "Data Connector - Upload Health",
        f"{DATA_CONNECTOR_URL}/api/v1/connectors/upload/health",
        "GET"
    )
    
    # Database Health
    test_endpoint(
        "Data Connector - Database Health",
        f"{DATA_CONNECTOR_URL}/api/v1/connectors/database/health",
        "GET"
    )
    
    # Storage Health
    test_endpoint(
        "Data Connector - Storage Health",
        f"{DATA_CONNECTOR_URL}/api/v1/connectors/storage/health",
        "GET"
    )
    
    # Taiwan APIs Health
    test_endpoint(
        "Data Connector - Taiwan APIs Health",
        f"{DATA_CONNECTOR_URL}/api/v1/connectors/taiwan/health",
        "GET"
    )
    
    # ============================================================
    # SUMMARY
    # ============================================================
    
    print_header("TEST SUMMARY")
    
    print(f"\nTotal Tests: {total_tests}")
    print(f"{Fore.GREEN}  Passed: {success_count}")
    print(f"{Fore.RED}  Failed: {fail_count}")
    
    pass_rate = (success_count / total_tests * 100) if total_tests > 0 else 0
    print(f"  Pass Rate: {pass_rate:.2f}%")
    
    if fail_count == 0:
        print(f"\n{Fore.GREEN}✓ All tests passed!")
        sys.exit(0)
    else:
        print(f"\n{Fore.RED}✗ Some tests failed. Please check the logs above.")
        sys.exit(1)


if __name__ == "__main__":
    main()

