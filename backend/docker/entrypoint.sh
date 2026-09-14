#!/bin/sh
set -e

if [ "$DATABASE" = "postgres" ]; then
    echo "Attente de la disponibilité de PostgreSQL..."
    while ! nc -z $DB_HOST $DB_PORT; do
      sleep 0.5
    done
    echo "PostgreSQL est prêt !"
fi

echo "Exécution des migrations..."
python manage.py migrate --noinput

exec "$@"
