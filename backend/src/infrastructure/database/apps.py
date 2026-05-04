from django.apps import AppConfig

class DatabaseConfig(AppConfig):
    name = 'src.infrastructure.database' # Path harus sampai ke folder database
    label = 'infrastructure'             # Tetap gunakan label ini agar 'app_label' di models cocok
