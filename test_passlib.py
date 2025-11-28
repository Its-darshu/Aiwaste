from passlib.context import CryptContext
import bcrypt

print(f"Bcrypt version: {bcrypt.__version__}")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hash = pwd_context.hash("secret")
print(f"Hash: {hash}")
verify = pwd_context.verify("secret", hash)
print(f"Verify: {verify}")
