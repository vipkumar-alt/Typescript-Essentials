export {};

// Typed callback signatures used by Observer handlers.
type NextHandler<T> = (value: T) => void;
type ErrorHandler = (error: unknown) => void;
type CompleteHandler = () => void;
type TeardownLogic = () => void;

// Each observer callback is optional, but when provided it must match the Observable value type.
interface ObserverHandlers<T> {
  next?: NextHandler<T>;
  error?: ErrorHandler;
  complete?: CompleteHandler;
}

class Observer<T> {
  private isUnsubscribed = false;
  public _unsubscribe?: TeardownLogic;

  constructor(private handlers: ObserverHandlers<T>) {}

  next(value: T): void {
    if (this.handlers.next && !this.isUnsubscribed) {
      this.handlers.next(value);
    }
  }

  error(error: unknown): void {
    if (!this.isUnsubscribed) {
      this.handlers.error?.(error);
      this.unsubscribe();
    }
  }

  complete(): void {
    if (!this.isUnsubscribed) {
      this.handlers.complete?.();
      this.unsubscribe();
    }
  }

  unsubscribe(): void {
    this.isUnsubscribed = true;
    this._unsubscribe?.();
  }
}

class Observable<T> {
  // The subscribe function receives a typed Observer and returns cleanup logic.
  constructor(private _subscribe: (observer: Observer<T>) => TeardownLogic) {}

  static from<T>(values: T[]): Observable<T> {
    return new Observable<T>((observer) => {
      values.forEach((value) => observer.next(value));
      observer.complete();

      return () => {
        console.log('unsubscribed');
      };
    });
  }

  subscribe(obs: ObserverHandlers<T>): { unsubscribe: () => void } {
    const observer = new Observer<T>(obs);
    observer._unsubscribe = this._subscribe(observer);

    return {
      unsubscribe(): void {
        observer.unsubscribe();
      },
    };
  }
}

const HTTP_POST_METHOD = 'POST' as const;
const HTTP_GET_METHOD = 'GET' as const;

const HTTP_STATUS_OK = 200 as const;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500 as const;

// Literal union types restrict requests and responses to supported values only.
type HttpMethod = typeof HTTP_POST_METHOD | typeof HTTP_GET_METHOD;
type HttpStatus = typeof HTTP_STATUS_OK | typeof HTTP_STATUS_INTERNAL_SERVER_ERROR;

interface User {
  name: string;
  age: number;
  roles: string[];
  createdAt: Date;
  isDeleted: boolean;
}

interface BaseRequest {
  method: HttpMethod;
  host: string;
  path: string;
  params: Record<string, string>;
}

interface PostRequest<TBody> extends BaseRequest {
  method: typeof HTTP_POST_METHOD;
  body: TBody;
}

interface GetRequest extends BaseRequest {
  method: typeof HTTP_GET_METHOD;
}

// Named HttpRequest/HttpResponse to avoid conflicts with built-in DOM Request/Response types.
type HttpRequest = PostRequest<User> | GetRequest;

interface HttpResponse {
  status: HttpStatus;
}

const userMock: User = {
  name: 'User Name',
  age: 26,
  roles: ['user', 'admin'],
  createdAt: new Date(),
  isDeleted: false,
};

const requestsMock: HttpRequest[] = [
  {
    method: HTTP_POST_METHOD,
    host: 'service.example',
    path: 'user',
    body: userMock,
    params: {},
  },
  {
    method: HTTP_GET_METHOD,
    host: 'service.example',
    path: 'user',
    params: {
      id: '3f5h67s4s',
    },
  },
];

const handleRequest = (request: HttpRequest): HttpResponse => {
  return { status: HTTP_STATUS_OK };
};

const handleError = (error: unknown): HttpResponse => {
  return { status: HTTP_STATUS_INTERNAL_SERVER_ERROR };
};

const handleComplete = (): void => console.log('complete');

// The Observable is explicitly typed to emit HttpRequest objects.
const requests$ = Observable.from<HttpRequest>(requestsMock);

const subscription = requests$.subscribe({
  next: handleRequest,
  error: handleError,
  complete: handleComplete,
});

subscription.unsubscribe();
