export enum UserRole {
  CITOYEN = 'citoyen',
  MODERATEUR = 'moderateur',
  ADMINISTRATEUR = 'administrateur',
  SUPER_ADMIN = 'super_admin',
}

export enum UserStatut {
  ACTIF = 'actif',
  INACTIF = 'inactif',
  SUSPENDU = 'suspendu',
}

export interface User {
  idUtilisateur: number;
  nom: string | null;
  prenom: string | null;
  email: string;
  role: UserRole;
  statut: UserStatut;
  dateCreation: string;
}
