"""
Core abstract models for Flowexa.
Provides foundational models for all subsequent domain modules.
"""
import uuid
from django.db import models


class UUIDModel(models.Model):
    """
    Abstract base model that uses a UUIDv4 as its primary key.
    Ensures safe distributed IDs, collision avoidance across tenants,
    and prevents auto-increment enumeration attacks.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Identifiant unique universel (UUIDv4)"
    )

    class Meta:
        abstract = True


class TimeStampedModel(UUIDModel):
    """
    Abstract model with UUID primary key, creation timestamp,
    and automatic last update timestamp.
    """
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="Date et heure de création"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Date et heure de dernière modification"
    )

    class Meta:
        abstract = True
        ordering = ['-created_at']


class ActiveModel(TimeStampedModel):
    """
    Abstract model adding an active status flag for soft status management.
    """
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Indique si l'entité est active"
    )

    class Meta:
        abstract = True
