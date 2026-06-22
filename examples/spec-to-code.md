# 示例：从 Spec 到代码的完整链路

本示例展示 SDD 中的一条业务规则如何直接驱动测试用例和实现代码。

## SDD 业务规则

来自 `03-sdd.md`：

```markdown

### B1：密码强度校验

- **MUST** 拒绝长度小于 8 个字符的密码
- **MUST** 拒绝不含大写字母的密码
- **MUST** 拒绝不含数字的密码
- **SHOULD** 接受含特殊字符的密码
- **MAY** 提供密码强度指示（弱/中/强）

Given 用户提交注册表单
When 密码字段输入 "abc123"
Then 系统 MUST 拒绝并提示 "密码至少需要 8 个字符"
```

## 测试（RED 阶段）

来自 `06-tdd-log.md`：

```python
def test_password_too_short():
    result = validate_password("abc123")
    assert result.is_valid == False
    assert "至少需要 8 个字符" in result.error_message

def test_password_no_uppercase():
    result = validate_password("abcdefgh")
    assert result.is_valid == False
    assert "大写字母" in result.error_message

def test_password_no_digit():
    result = validate_password("Abcdefgh")
    assert result.is_valid == False
    assert "数字" in result.error_message

def test_valid_password():
    result = validate_password("Abcdef1g")
    assert result.is_valid == True
    assert result.error_message is None
```

## 实现（GREEN 阶段）

```python
def validate_password(password: str) -> ValidationResult:
    errors = []
    if len(password) < 8:
        errors.append("密码至少需要 8 个字符")
    if not any(c.isupper() for c in password):
        errors.append("密码必须包含至少一个大写字母")
    if not any(c.isdigit() for c in password):
        errors.append("密码必须包含至少一个数字")

    return ValidationResult(
        is_valid=len(errors) == 0,
        error_message=errors[0] if errors else None
    )
```

## 可追溯链

```
SDD B1（业务规则）
  → test_password_too_short()（测试用例）
    → validate_password()（实现代码）
      → reviewAgent 检查："实现是否覆盖 SDD B1？" ✅
```

每个测试用例引用其 SDD 来源。每个审查发现引用 SDD 条目。整条链路完全可追溯。
